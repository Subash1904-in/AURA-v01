
import React, { useRef, useEffect, useState, useCallback } from 'react';

declare const faceapi: any;

interface UserDetectorProps {
  onUserDetected: () => void;
  onUserNotDetected: () => void;
}

const UserDetector: React.FC<UserDetectorProps> = ({ onUserDetected, onUserNotDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const userPresentRef = useRef(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('Loading...');

  const loadModels = useCallback(async () => {
    // FIX: Switched to raw.githack.com CDN as a more reliable source for model weights.
    const MODEL_URL = 'https://raw.githack.com/justadudewhohacks/face-api.js/master/weights';
    setStatus('Loading face detection models...');
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatus('Models loaded. Starting camera...');
    } catch (e) {
      console.error("Error loading models: ", e);
      if (e instanceof Error && e.message.toLowerCase().includes('failed to fetch')) {
        setStatus('Network error: Could not load models. Auto-start disabled.');
      } else {
        setStatus('Error loading models. Auto-start disabled.');
      }
    }
  }, []);

  const startVideo = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('Camera started. Detecting user...');
        }
      })
      .catch(err => {
        console.error("Error accessing camera: ", err);
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                setStatus('Camera permission denied. Enable it in browser settings for auto-start.');
            } else if (err.name === 'NotFoundError') {
                setStatus('No camera found. Auto-start disabled.');
            } else {
                setStatus('Error accessing camera. Auto-start disabled.');
            }
        } else {
             setStatus('Could not access camera. Please grant permission.');
        }
      });
  }, []);
  
  const stopVideo = useCallback(() => {
     if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
     }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (modelsLoaded) {
      startVideo();
    }
    return () => stopVideo();
  }, [modelsLoaded, startVideo, stopVideo]);

  useEffect(() => {
    let videoEl: HTMLVideoElement | null = null;
    
    const handlePlay = () => {
      if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
      }
      // Check for user presence every 2 seconds
      detectionIntervalRef.current = window.setInterval(async () => {
        if (videoRef.current && !videoRef.current.paused) {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
          const isPresent = detections.length > 0;
          
          if (isPresent && !userPresentRef.current) {
            userPresentRef.current = true;
            onUserDetected();
          } else if (!isPresent && userPresentRef.current) {
            userPresentRef.current = false;
            onUserNotDetected();
          }
        }
      }, 2000);
    };

    if (modelsLoaded && videoRef.current) {
      videoEl = videoRef.current;
      videoEl.addEventListener('play', handlePlay);
    }

    return () => {
      if (videoEl) {
        videoEl.removeEventListener('play', handlePlay);
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [modelsLoaded, onUserDetected, onUserNotDetected]);

  return (
    <>
      <video ref={videoRef} autoPlay muted playsInline style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '1px', height: '1px', zIndex: -1 }}></video>
      <div className="absolute bottom-4 left-4 bg-black/50 text-white/70 text-xs px-2 py-1 rounded z-10">
        {status}
      </div>
    </>
  );
};

export default UserDetector;