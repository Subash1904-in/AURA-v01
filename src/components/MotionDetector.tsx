import React, { useEffect, useRef, useState } from 'react';

interface MotionDetectorProps {
  onMotionDetected: () => void;
  isActive: boolean; // If true, we might pause detection to save resources, or keep running
  sensitivity?: number; // 0-100
}

export const MotionDetector: React.FC<MotionDetectorProps> = ({ 
  onMotionDetected, 
  isActive,
  sensitivity = 20 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const previousFrameData = useRef<Uint8ClampedArray | null>(null);
  const motionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 320, 
            height: 240, 
            facingMode: 'user',
            frameRate: { ideal: 10 } // Low framerate is fine for motion
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.warn("Camera access denied for motion detection. Falling back to mouse interaction.", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!hasPermission) return;

    let animationFrame: number;
    const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
    const width = 64; // Low res for performance
    const height = 48;

    const checkForMotion = () => {
      if (videoRef.current && ctx && videoRef.current.readyState === 4) {
        // Draw current video frame to canvas (scaled down)
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        let score = 0;

        if (previousFrameData.current) {
          // Compare pixels
          for (let i = 0; i < data.length; i += 4) {
            // Compare RGB channels
            const rDiff = Math.abs(data[i] - previousFrameData.current[i]);
            const gDiff = Math.abs(data[i + 1] - previousFrameData.current[i + 1]);
            const bDiff = Math.abs(data[i + 2] - previousFrameData.current[i + 2]);
            
            if (rDiff + gDiff + bDiff > 100) {
              score++;
            }
          }
        }

        previousFrameData.current = data;

        // If score exceeds threshold (motion detected)
        // sensitivity mapping: roughly how many pixels changed
        const threshold = (100 - sensitivity) * 5; 
        
        if (score > threshold) {
           // Debounce the callback
           if (!motionTimeoutRef.current) {
             onMotionDetected();
             // Cooldown to prevent spamming
             motionTimeoutRef.current = window.setTimeout(() => {
               motionTimeoutRef.current = null;
             }, 1000);
           }
        }
      }

      animationFrame = requestAnimationFrame(checkForMotion);
    };

    animationFrame = requestAnimationFrame(checkForMotion);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasPermission, sensitivity, onMotionDetected]);

  return (
    <div className="hidden">
       {/* Hidden elements for processing */}
       <video ref={videoRef} autoPlay playsInline muted width="320" height="240" />
       <canvas ref={canvasRef} width="64" height="48" />
    </div>
  );
};
