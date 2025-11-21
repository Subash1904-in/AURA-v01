import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, VoiceState } from './types';
import { PosterCarousel } from './components/PosterCarousel';
import { ActiveScreen } from './components/ActiveScreen';
import { AdminPanel } from './components/AdminPanel';
import { FaceDetector } from './components/FaceDetector'; // Using FaceDetector now
import { generateResponse } from './services/geminiService';
import { PosterProvider } from './contexts/PosterContext';

// Define Speech Recognition Types globally
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const IDLE_TIMEOUT_MS = 20000; // 20 Seconds Timeout

const AppContent: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.LISTENING);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  
  // Timers & Refs
  const lastPresenceTimeRef = useRef<number>(Date.now());
  const idleCheckIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Speech Refs
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const isProcessingRef = useRef(false); 
  const isMicrophoneAllowedRef = useRef(true); 

  // --- Routing & Admin Shortcuts ---
  useEffect(() => {
    // Check URL Hash for admin route on initial load only
    const checkHash = () => {
        if (window.location.hash === '#admin') {
            setAppState(AppState.ADMIN);
        }
    };
    checkHash();
    // We removed the 'hashchange' listener to prevent conflicts with internal state management
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'a') {
        setAppState(prev => {
            const newState = prev === AppState.ADMIN ? AppState.IDLE : AppState.ADMIN;
            // If exiting admin via shortcut, clear hash safely
            if (newState === AppState.IDLE) {
                 window.history.replaceState(null, '', window.location.pathname);
            }
            return newState;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeAdmin = () => {
      // Safe history manipulation that doesn't trigger reload
      window.history.replaceState(null, '', window.location.pathname);
      setAppState(AppState.IDLE);
      lastPresenceTimeRef.current = Date.now(); // Reset timer on exit
  };

  // --- Voice Logic ---

  const startListening = useCallback(() => {
    if (isProcessingRef.current) return; 
    if (appState !== AppState.ACTIVE) return; 

    if (!isMicrophoneAllowedRef.current) {
        setVoiceState(VoiceState.ERROR);
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error("Speech Recognition API not supported.");
        setVoiceState(VoiceState.ERROR);
        return; 
    }

    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState(VoiceState.LISTENING);
    };

    recognition.onresult = (event: any) => {
      // Reset presence on speech interaction
      lastPresenceTimeRef.current = Date.now();

      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          setTranscript(finalTranscript);
          handleVoiceInput(finalTranscript);
          return;
        } else {
          interimTranscript += event.results[i][0].transcript;
          setTranscript(interimTranscript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
         isMicrophoneAllowedRef.current = false;
         setVoiceState(VoiceState.ERROR);
         return;
      }
      if (event.error === 'no-speech') return;
      if (event.error === 'network') {
         if (appState === AppState.ACTIVE && !isProcessingRef.current) {
             setTimeout(() => { try { recognition.start(); } catch(e) {} }, 2000);
         }
         return;
      }
    };

    recognition.onend = () => {
      if (appState === AppState.ACTIVE && 
          !isProcessingRef.current && 
          isMicrophoneAllowedRef.current && 
          voiceState !== VoiceState.ERROR) {
         try { recognition.start(); } catch(e) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {}
  }, [appState, voiceState]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; 
      recognitionRef.current.stop();
    }
  };

  // --- Presence Logic (Face Detection + Timeout) ---

  // Called continuously when Face is detected
  const handleFaceDetected = useCallback(() => {
    const now = Date.now();
    lastPresenceTimeRef.current = now;

    // If we were IDLE, wake up!
    if (appState === AppState.IDLE) {
        console.log("Face Detected: Waking Up");
        setAppState(AppState.ACTIVE);
        // Wait a moment for state transition then start listening
        setTimeout(() => startListening(), 100); 
    }
  }, [appState, startListening]);

  // Polling for Timeout
  useEffect(() => {
    // Check every 1 second if we have exceeded timeout
    idleCheckIntervalRef.current = setInterval(() => {
        if (appState === AppState.ACTIVE) {
            const elapsed = Date.now() - lastPresenceTimeRef.current;
            if (elapsed > IDLE_TIMEOUT_MS) {
                console.log("Timeout reached. Returning to IDLE.");
                setAppState(AppState.IDLE);
                stopListening();
                if (synthesisRef.current) synthesisRef.current.cancel();
                setResponse('');
                setTranscript('');
                setVoiceState(VoiceState.LISTENING);
            }
        }
    }, 1000);

    return () => {
        if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
    };
  }, [appState]);

  // Restart listening if we enter ACTIVE state
  useEffect(() => {
    if (appState === AppState.ACTIVE) {
        startListening();
    } else {
        stopListening();
    }
  }, [appState, startListening]);


  // --- Output Logic ---

  const speakResponse = (text: string) => {
    setVoiceState(VoiceState.SPEAKING);
    if (synthesisRef.current) synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
        v.name.includes("Google US English") || v.name.includes("Samantha")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      isProcessingRef.current = false;
      setVoiceState(VoiceState.LISTENING);
      setTimeout(() => startListening(), 200);
    };

    utterance.onerror = () => {
        isProcessingRef.current = false;
        setVoiceState(VoiceState.LISTENING);
        startListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    stopListening();
    isProcessingRef.current = true;
    setVoiceState(VoiceState.THINKING);
    const aiResponse = await generateResponse(text);
    setResponse(aiResponse);
    speakResponse(aiResponse);
  };

  // --- Render ---

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-white/20 font-sans">
      
      {/* Face Detector (Always running to wake up or keep awake) */}
      {appState !== AppState.ADMIN && (
          <FaceDetector 
            onFaceDetected={handleFaceDetected} 
            isActive={true}
          />
      )}

      {/* Dynamic Background */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{ 
          background: appState === AppState.IDLE 
            ? "radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%)"
            : appState === AppState.ADMIN
            ? "radial-gradient(circle at 50% 50%, #0f172a 0%, #000000 100%)"
            : "radial-gradient(circle at 50% 30%, #2a2a3a 0%, #000000 100%)"
        }}
        transition={{ duration: 1.5 }}
      />

      {/* Grain Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 pointer-events-none" />

      <main className="relative w-full h-full z-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* IDLE STATE */}
          {appState === AppState.IDLE && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 1.1, 
                filter: "blur(20px)",
                transition: { duration: 0.6 } 
              }}
              className="w-full h-full relative"
            >
              <PosterCarousel />
              
              {/* Admin Link - Using Button to prevent Navigation Errors in Sandbox */}
              <button 
                onClick={() => setAppState(AppState.ADMIN)}
                className="admin-trigger absolute bottom-6 right-6 text-xs font-medium text-white/20 hover:text-white/60 uppercase tracking-widest transition-colors z-50 bg-transparent border-none p-2"
              >
                Admin Access
              </button>
              
              <div className="absolute bottom-12 w-full text-center pointer-events-none">
                <p className="text-white/40 text-sm tracking-[0.3em] uppercase animate-pulse font-medium">
                   Approach to wake
                </p>
              </div>
            </motion.div>
          )}

          {/* ACTIVE STATE */}
          {appState === AppState.ACTIVE && (
            <motion.div
              key="active"
              className="w-full h-full"
            >
               <ActiveScreen 
                 voiceState={voiceState}
                 currentTranscript={transcript}
                 lastResponse={response}
               />
            </motion.div>
          )}

          {/* ADMIN STATE */}
          {appState === AppState.ADMIN && (
            <motion.div
              key="admin"
              className="w-full h-full z-50"
            >
              <AdminPanel onClose={closeAdmin} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <PosterProvider>
      <AppContent />
    </PosterProvider>
  );
};

export default App;