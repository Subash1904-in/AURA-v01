import { useEffect, useRef, useState, useCallback } from "react";

declare const faceapi: any;

interface CameraFeedProps {
  onMotionDetected: () => void;
  isActive: boolean;
}

const CameraFeed = ({ onMotionDetected, isActive }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://raw.githack.com/justadudewhohacks/face-api.js/master/weights';
      try {
        setStatus('Loading AI models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setStatus('Models loaded');
      } catch (e) {
        console.error("Error loading models: ", e);
        setStatus('Error loading models');
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;

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
        setStatus('Camera error');
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modelsLoaded]);

  useEffect(() => {
    if (!hasPermission || !isActive || !modelsLoaded) return;

    const detectUser = async () => {
      if (videoRef.current && !videoRef.current.paused) {
        try {
            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
            if (detections.length > 0) {
                onMotionDetected();
            }
        } catch (err) {
            console.error("Detection error:", err);
        }
      }
    };

    const interval = setInterval(detectUser, 500);
    return () => clearInterval(interval);
  }, [hasPermission, isActive, modelsLoaded, onMotionDetected]);

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
        {!hasPermission && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <span className="text-xs text-muted-foreground text-center px-1">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraFeed;
