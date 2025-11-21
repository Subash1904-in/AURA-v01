import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, VoiceState, MapNode } from './types';
import { PosterCarousel } from './components/PosterCarousel';
import { ActiveScreen } from './components/ActiveScreen';
import { AdminPanel } from './components/AdminPanel';
import { FaceDetector } from './components/FaceDetector';
import { PosterProvider } from './contexts/PosterContext';
import MapView from "@/components/MapView";
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { createBlob, decode, decodeAudioData } from "@/services/audioService";
import { findLocation, findShortestPath } from "@/services/navigationService";
import { searchWebsite } from "@/services/collegeInfoService";
import { floorPlans, nodes } from "@/data/mapData";

// ... Tool Declarations ...
const getNavigationPathDeclaration: FunctionDeclaration = {
  name: 'getNavigationPath',
  parameters: {
    type: Type.OBJECT,
    description: 'Finds and displays the navigation path to a specific location within the KSSEM college B-Block.',
    properties: {
      destination: {
        type: Type.STRING,
        description: 'The name or room number of the destination. Examples: "FEA/CIM LAB", "B101", "library", "Canteen"',
      },
    },
    required: ['destination'],
  },
};

const getCollegeInfoDeclaration: FunctionDeclaration = {
  name: 'getCollegeInfo',
  parameters: {
    type: Type.OBJECT,
    description: 'Retrieves information about the KSSEM college from a knowledge base. Use this for questions about departments, admissions, faculty, placements, etc.',
    properties: {
      query: {
        type: Type.STRING,
        description: 'The user\'s question about the college. Examples: "Tell me about the CSE department", "Who are the mechanical engineering faculty?", "What is the admission process?"',
      },
    },
    required: ['query'],
  },
};

const closeMapViewDeclaration: FunctionDeclaration = {
  name: 'closeMapView',
  parameters: {
    type: Type.OBJECT,
    description: 'Closes or dismisses the currently displayed navigation map view.',
    properties: {},
  },
};

const IDLE_TIMEOUT_MS = 30000; // 30 Seconds Timeout

const AppContent: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.LISTENING);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [navigationPath, setNavigationPath] = useState<MapNode[] | null>(null);

  // Timers & Refs
  const lastPresenceTimeRef = useRef<number>(Date.now());
  const idleCheckIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live API Refs
  const sessionPromiseRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const lastToolResponseImageRef = useRef<{ imageUrl: string; imageAlt: string } | null>(null);
  const interruptedRef = useRef(false);
  const speechDetectedCounterRef = useRef(0);

  const stopAudioPlayback = useCallback(() => {
    if (audioSourcesRef.current.size > 0) {
      console.log("Local Interruption: Stopping audio playback");
      audioSourcesRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
      });
      audioSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      interruptedRef.current = true;
      setVoiceState(VoiceState.LISTENING);
    }
  }, []);

  // --- Routing & Admin Shortcuts ---
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setAppState(AppState.ADMIN);
      }
    };
    checkHash();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'a') {
        setAppState(prev => {
          const newState = prev === AppState.ADMIN ? AppState.IDLE : AppState.ADMIN;
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
    window.history.replaceState(null, '', window.location.pathname);
    setAppState(AppState.IDLE);
    lastPresenceTimeRef.current = Date.now();
  };

  // --- Live API Logic ---

  const endConversation = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session: any) => session.close());
      sessionPromiseRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (streamSourceRef.current) {
      streamSourceRef.current.disconnect();
      streamSourceRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }

    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setVoiceState(VoiceState.LISTENING);
  }, []);

  const startConversation = useCallback(async () => {
    if (sessionPromiseRef.current) return; // Already started

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          tools: [{ functionDeclarations: [getNavigationPathDeclaration, getCollegeInfoDeclaration, closeMapViewDeclaration] }],
          systemInstruction: 'You are AURA, an AI assistant developed in the AI & DS department at KSSEM. If asked who you are or what your name is, reply: "I am AURA, developed in the AI & DS department." Never say you are Gemini. Communicate ONLY in English. Use tools to answer questions. For navigation, use `getNavigationPath`. For college info, use `getCollegeInfo`. Keep responses concise and conversational.',
        },
        callbacks: {
          onopen: () => {
            setVoiceState(VoiceState.LISTENING);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            streamSourceRef.current = source;
            // Reduced buffer size to 2048 for lower latency
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(2048, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);

              // Calculate RMS (Root Mean Square) to detect volume level
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);

              // Noise Gate Threshold - ignore quiet sounds (Increased to 0.04 to avoid false positives)
              const NOISE_THRESHOLD = 0.04;

              if (rms > NOISE_THRESHOLD) {
                speechDetectedCounterRef.current += 1;

                // Require 3 consecutive frames (~100ms) to trigger speech detection
                if (speechDetectedCounterRef.current >= 3) {
                  // Local Interruption: Stop audio immediately
                  stopAudioPlayback();

                  const pcmBlob = createBlob(inputData);
                  sessionPromiseRef.current.then((session: any) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                  });
                }
              } else {
                // Reset counter if silence is detected
                speechDetectedCounterRef.current = 0;
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              setVoiceState(VoiceState.THINKING);
              for (const fc of message.toolCall.functionCalls) {
                let resultText = "An unknown error occurred.";

                if (fc.name === 'getNavigationPath') {
                  const destination = fc.args.destination as string;
                  const destinationNode = findLocation(destination);

                  if (destinationNode) {
                    const path = findShortestPath('ENTRANCE', destinationNode.id);
                    if (path) {
                      setNavigationPath(path);
                      resultText = `Showing the path to ${destinationNode.name}.`;
                    } else {
                      resultText = `I found ${destinationNode.name}, but couldn't calculate a path to it.`;
                    }
                  } else {
                    resultText = `I couldn't find a location called "${destination}". Please try again.`;
                  }
                } else if (fc.name === 'getCollegeInfo') {
                  const query = fc.args.query as string;
                  const searchResult = await searchWebsite(query);
                  resultText = searchResult.text;
                  if (searchResult.imageUrl) {
                    lastToolResponseImageRef.current = { imageUrl: searchResult.imageUrl, imageAlt: searchResult.imageAlt || 'College Information' };
                  }
                } else if (fc.name === 'closeMapView') {
                  setNavigationPath(null);
                  resultText = "Okay, closing the map.";
                }

                sessionPromiseRef.current?.then((session: any) => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: resultText },
                    }
                  });
                });
              }
            }


            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text + ' ';
              setResponse(currentOutputTranscriptionRef.current); // Update UI with partial response
            }
            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text + ' ';
              setTranscript(currentInputTranscriptionRef.current); // Update UI with partial transcript
            }

            if (message.serverContent?.turnComplete) {
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
              setVoiceState(VoiceState.LISTENING);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              if (interruptedRef.current) return;

              setVoiceState(VoiceState.SPEAKING);
              const outputAudioContext = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);

              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                  setVoiceState(VoiceState.LISTENING);
                }
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of audioSourcesRef.current.values()) {
                source.stop();
                audioSourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
              interruptedRef.current = false; // Reset interruption flag
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('API Error:', e);
            setVoiceState(VoiceState.ERROR);
            endConversation();
          },
          onclose: () => {
            endConversation();
          },
        },
      });

    } catch (err) {
      console.error('Failed to start conversation:', err);
      setVoiceState(VoiceState.ERROR);
      endConversation();
    }
  }, []);

  // --- Presence Logic (Face Detection + Timeout) ---

  const handleFaceDetected = useCallback(() => {
    const now = Date.now();
    lastPresenceTimeRef.current = now;

    if (appState === AppState.IDLE) {
      console.log("Face Detected: Waking Up");
      setAppState(AppState.ACTIVE);
    }
  }, [appState]);

  // Polling for Timeout
  useEffect(() => {
    idleCheckIntervalRef.current = setInterval(() => {
      if (appState === AppState.ACTIVE) {
        const elapsed = Date.now() - lastPresenceTimeRef.current;
        if (elapsed > IDLE_TIMEOUT_MS) {
          console.log("Timeout reached. Returning to IDLE.");
          setAppState(AppState.IDLE);
          endConversation();
          setResponse('');
          setTranscript('');
          setNavigationPath(null);
        }
      }
    }, 1000);

    return () => {
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
    };
  }, [appState, endConversation]);

  // Start/Stop conversation based on AppState
  useEffect(() => {
    if (appState === AppState.ACTIVE) {
      startConversation();
    } else {
      endConversation();
    }
  }, [appState, startConversation, endConversation]);


  // --- Render ---

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-white/20 font-sans">

      {/* Face Detector */}
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
              className="w-full h-full relative"
            >
              <ActiveScreen
                voiceState={voiceState}
                currentTranscript={transcript}
                lastResponse={response}
              />

              {/* Map View Overlay */}
              {navigationPath && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 rounded-xl overflow-hidden p-8">
                  <MapView
                    path={navigationPath}
                    floorPlans={floorPlans}
                    nodes={nodes}
                    onClose={() => setNavigationPath(null)}
                  />
                </div>
              )}
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
