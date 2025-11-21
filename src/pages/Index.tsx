import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import VoiceIndicator from "@/components/VoiceIndicator";
import CameraFeed from "@/components/CameraFeed";
import PosterCarousel from "@/components/PosterCarousel";
import campusBg from "@/assets/campus-bg.jpg";
import Transcript from "@/components/Transcript";
import Controls from "@/components/Controls";
import MapView from "@/components/MapView";
import { ConversationState, Message, MapNode } from "@/types";
import { createBlob, decode, decodeAudioData } from "@/services/audioService";
import { findLocation, findShortestPath } from "@/services/navigationService";
import { searchWebsite } from "@/services/collegeInfoService";
import { floorPlans, nodes } from "@/data/mapData";

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

const DEACTIVATION_TIMEOUT_MS = 30000; // 30 seconds

const Index = () => {
  // AI & Logic State
  const [isAssistantActive, setAssistantActive] = useState(false);
  const [isUserPresent, setIsUserPresent] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [navigationPath, setNavigationPath] = useState<MapNode[] | null>(null);

  // Refs
  const conversationStateRef = useRef<ConversationState>(ConversationState.IDLE);
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
  const deactivationTimerRef = useRef<number | null>(null);
  const interruptedRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // UI State (from new frontend)
  const [showPulse, setShowPulse] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleInterrupt = useCallback(() => {
    interruptedRef.current = true;
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    audioSourcesRef.current.clear();

    const utterance = new SpeechSynthesisUtterance("Ok");
    window.speechSynthesis.speak(utterance);

    // Force state reset if onended doesn't fire or if we want immediate feedback
    setConversationState(ConversationState.LISTENING);
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim().toLowerCase();
            if (transcript.includes('enough') || transcript.includes('stop')) {
              handleInterrupt();
            }
          }
        }
      };
      recognitionRef.current = recognition;
    }
  }, [handleInterrupt]);

  // Update ref when state changes
  useEffect(() => {
    conversationStateRef.current = conversationState;

    if (conversationState === ConversationState.SPEAKING) {
      interruptedRef.current = false;
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Ignore if already started
      }
    } else {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
  }, [conversationState]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (deactivationTimerRef.current) {
        clearTimeout(deactivationTimerRef.current);
      }
    }
  }, []);

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

    setConversationState(ConversationState.IDLE);
  }, []);

  const handleToggleConversation = useCallback(async () => {
    if (conversationState !== ConversationState.IDLE) {
      // Manual stop
      if (deactivationTimerRef.current) {
        clearTimeout(deactivationTimerRef.current);
        deactivationTimerRef.current = null;
      }
      endConversation();
      setAssistantActive(false);
      return;
    }

    // Start conversation
    setError(null);
    setNavigationPath(null);
    setMessages([]);

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
          systemInstruction: 'You are AURA, an AI assistant developed in the AI & DS department at KSSEM. If asked who you are or what your name is, reply: "I am AURA, developed in the AI & DS department." Never say you are Gemini. Communicate ONLY in English. If a user speaks in any other language (Hindi, Kannada, Tamil, Telugu, etc.), politely respond in English and ask them to speak in English. Use your tools to answer questions. For navigation inside the B-Block, use the `getNavigationPath` tool. To close the map view, use the `closeMapView` tool. For any factual questions about the college (like departments, admissions, facilities, etc.), you MUST use the `getCollegeInfo` tool to retrieve information from the knowledge base. Do not answer from general knowledge. After using a tool, synthesize the information into a concise, conversational answer. If a user asks a general question, gently guide the conversation back to topics related to the college.',
        },
        callbacks: {
          onopen: () => {
            setConversationState(ConversationState.LISTENING);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            streamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              if (conversationStateRef.current === ConversationState.SPEAKING) {
                return;
              }
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
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
            }
            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text + ' ';
            }

            if (message.serverContent?.turnComplete) {
              const userInput = currentInputTranscriptionRef.current.trim();
              const modelOutput = currentOutputTranscriptionRef.current.trim();
              if (userInput) {
                setMessages(prev => [...prev, { role: 'user', text: userInput }]);
              }
              if (modelOutput) {
                const newAssistantMessage: Message = { role: 'assistant', text: modelOutput };
                if (lastToolResponseImageRef.current) {
                  newAssistantMessage.imageUrl = lastToolResponseImageRef.current.imageUrl;
                  newAssistantMessage.imageAlt = lastToolResponseImageRef.current.imageAlt;
                  lastToolResponseImageRef.current = null;
                }
                setMessages(prev => [...prev, newAssistantMessage]);
              }
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              if (interruptedRef.current) return;

              setConversationState(ConversationState.SPEAKING);
              const outputAudioContext = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);

              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                  setConversationState(ConversationState.LISTENING);
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
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('API Error:', e);
            let detailedError = 'An API error occurred. Please try again.';
            if (navigator.onLine === false) {
              detailedError = 'You seem to be offline. Please check your internet connection.';
            } else {
              detailedError = 'Could not connect to the AI service. Please check your network connection, disable any ad-blockers or VPNs that might interfere, and try again.';
            }
            setError(detailedError);
            endConversation();
            setAssistantActive(false);
          },
          onclose: () => {
            endConversation();
            setAssistantActive(false);
          },
        },
      });

    } catch (err) {
      console.error('Failed to start conversation:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (err instanceof Error) {
        setError(err.message || 'Failed to access microphone. Please ensure it is connected and enabled.');
      } else {
        setError('Failed to access microphone. Please ensure it is connected and enabled.');
      }
      endConversation();
      setAssistantActive(false);
    }
  }, [conversationState, endConversation]);

  const handleMotionDetected = useCallback(() => {
    setIsUserPresent(true);

    // Play audio feedback (from new frontend)
    if (!isAssistantActive) {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiDcIF2m98OScTgwPUKXh8LxnHwU7k9n0yHkpBSd+zPLaizsKElyw6OyrVxQKRp/g8r5sIAUsgs/z2og1Bxdqvu/mnU4MD1Kl4O+8aCAEO5PZ9Mh5KQUofsz02os7ChJctOjrq1cUCkij5PK9aR8ELIPPs9eHNgcYbcDw5p1PDAxUpePvvG0gBDqR1/PJeisGKH/O8tiKPAoRXrTp6KpYEwpJo+TyvmshBCuE0PTYiDYHGG7A7+adTg8NVaTk8L1tIQQ6k9j0yHorBih/zvLXiT0KElyw6+mrWhQJR6Lj8r5rHwQshNDz14g2BxhvwO/mnU4PDFWk5PC9bSIFOpPY9Mh6LAYnfszz14k9ChJcr+jrrFoUCUei4/K+ax8ELITPs9aINwcYb8Dv5p1OEAxVpOTwvWwiBTqR1/TJeSwGKH7M89eIPQoSXK/o66xaFAlHoePyvmsf');
      }
      audioRef.current.play().catch(() => { });
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 1000);

      setAssistantActive(true);
    }

    if (deactivationTimerRef.current) {
      clearTimeout(deactivationTimerRef.current);
      deactivationTimerRef.current = null;
    }
  }, [isAssistantActive]);

  const handleUserNotDetected = useCallback(() => {
    // This logic was in UserDetector's onUserNotDetected, but CameraFeed doesn't seem to have a "not detected" callback explicitly, 
    // it just stops calling onMotionDetected.
    // However, CameraFeed in new frontend had an inactivity timer.
    // We can implement the inactivity timer here.

    // Actually, CameraFeed calls onMotionDetected repeatedly.
    // We need a way to detect lack of motion.
    // The new frontend's Index.tsx had this logic:
    /*
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setIsListening(false);
    }, 15000);
    */

    // We can adapt this.
    if (deactivationTimerRef.current) {
      clearTimeout(deactivationTimerRef.current);
    }
    deactivationTimerRef.current = window.setTimeout(() => {
      setIsUserPresent(false);
      endConversation();
      setAssistantActive(false);
      deactivationTimerRef.current = null;
    }, DEACTIVATION_TIMEOUT_MS);

  }, [endConversation]);

  // Wrap handleMotionDetected to include the inactivity timer reset
  const onMotionDetected = useCallback(() => {
    handleMotionDetected();
    handleUserNotDetected(); // This resets the timer
  }, [handleMotionDetected, handleUserNotDetected]);


  useEffect(() => {
    if (isAssistantActive && conversationState === ConversationState.IDLE) {
      handleToggleConversation();
    }
  }, [isAssistantActive, conversationState, handleToggleConversation]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${campusBg})`,
          filter: 'blur(8px)',
          transform: 'scale(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-background/80" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Camera Feed */}
        <CameraFeed onMotionDetected={onMotionDetected} isActive={true} />

        {/* Voice Indicator - shown when listening/speaking */}
        {isAssistantActive && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-20">
            <VoiceIndicator />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-4xl flex items-center justify-center min-h-[60vh] relative">
            {!isAssistantActive ? (
              <PosterCarousel />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {/* Map View Overlay */}
                {navigationPath && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 rounded-xl overflow-hidden">
                    <MapView
                      path={navigationPath}
                      floorPlans={floorPlans}
                      nodes={nodes}
                      onClose={() => setNavigationPath(null)}
                    />
                  </div>
                )}

                {/* Transcript */}
                <div className="w-full h-[400px] mb-20">
                  <Transcript messages={messages} />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="absolute bottom-24 w-full text-center p-2">
                    <p className="text-red-400 bg-black/50 rounded-md inline-block px-4 py-2">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Controls */}
        {isAssistantActive && (
          <div className="fixed bottom-8 left-0 right-0 z-30">
            <Controls onToggle={handleToggleConversation} state={conversationState} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

