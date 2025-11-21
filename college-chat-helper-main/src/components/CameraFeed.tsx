import { useEffect, useRef, useState } from "react";

interface CameraFeedProps {
  onMotionDetected: () => void;
  isActive: boolean;
}

const CameraFeed = ({ onMotionDetected, isActive }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const previousFrameRef = useRef<ImageData | null>(null);
  const motionThreshold = 30;
  const pixelDiffThreshold = 5000;

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 320 },
            height: { ideal: 240 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!hasPermission || !isActive) return;

    const detectMotion = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (previousFrameRef.current) {
        let diffCount = 0;
        
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const diff = Math.abs(currentFrame.data[i] - previousFrameRef.current.data[i]);
          
          if (diff > motionThreshold) {
            diffCount++;
          }
        }

        if (diffCount > pixelDiffThreshold) {
          onMotionDetected();
        }
      }

      previousFrameRef.current = currentFrame;
    };

    const interval = setInterval(detectMotion, 200);
    return () => clearInterval(interval);
  }, [hasPermission, isActive, onMotionDetected]);

  return (
    <div className="fixed top-4 right-4 z-20">
      <div className="relative rounded-lg overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-20 h-15 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        {!hasPermission && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <span className="text-xs text-muted-foreground">Camera access needed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraFeed;
