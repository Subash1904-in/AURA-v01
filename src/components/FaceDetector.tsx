import React, { useEffect, useRef, useState } from 'react';

// Declare global faceapi
declare const faceapi: any;

interface FaceDetectorProps {
  onFaceDetected: () => void;
  isActive: boolean;
}

export const FaceDetector: React.FC<FaceDetectorProps> = ({ onFaceDetected, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // 1. Load Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        // await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); // Optional: heavier
        console.log("FaceAPI models loaded");
        setModelsLoaded(true);
      } catch (error) {
        console.error("Failed to load FaceAPI models", error);
      }
    };
    loadModels();
  }, []);

  // 2. Start Camera
  useEffect(() => {
    if (!modelsLoaded) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 320, // Keep resolution low for performance
            height: 240,
            facingMode: 'user'
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera permission denied", err);
      }
    };

    startVideo();
  }, [modelsLoaded]);

  // 3. Detection Loop
  useEffect(() => {
    if (!modelsLoaded || !hasPermission || !videoRef.current) return;

    const interval = setInterval(async () => {
      // Only process if active (or we want to wake up)
      // Even if not 'isActive' (IDLE), we need to scan to WAKE UP.
      // The 'isActive' prop passed from App might indicate if we are already in ACTIVE state,
      // but we always need detection to maintain presence or wake up.
      
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
        
        // Detect single face
        const detection = await faceapi.detectSingleFace(videoRef.current, options);

        if (detection) {
           onFaceDetected();
        }
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [modelsLoaded, hasPermission, onFaceDetected]);

  return (
    <div className="fixed top-0 left-0 opacity-0 pointer-events-none z-[-1]">
      <video ref={videoRef} autoPlay muted playsInline width="320" height="240" />
    </div>
  );
};