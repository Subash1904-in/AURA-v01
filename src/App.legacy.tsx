import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';
import Controls from './components/Controls';
import MapView from './components/MapView';
import { ConversationState, Message, MapNode } from './types';
import { createBlob, decode, decodeAudioData } from './services/audioService';
import { findLocation, findShortestPath } from './services/navigationService';
import { searchWebsite } from './services/collegeInfoService';
import { floorPlans, nodes } from './data/mapData';
import IdleView from './components/IdleView';
import Admin from './pages/Admin';
import UserDetector from './components/UserDetector';
import UserPresenceIndicator from './components/UserPresenceIndicator';


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

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);
  const [isAssistantActive, setAssistantActive] = useState(false);
  const [isUserPresent, setIsUserPresent] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [navigationPath, setNavigationPath] = useState<MapNode[] | null>(null);

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
  const lastToolResponseImageRef = useRef<{imageUrl: string; imageAlt: string} | null>(null);
  const deactivationTimerRef = useRef<number | null>(null);


  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
            systemInstruction: 'You are a friendly and helpful AI assistant for KSSEM, the K. S. School of Engineering and Management in Bengaluru, India. IMPORTANT: You MUST communicate ONLY in English. If a user speaks in any other language (Hindi, Kannada, Tamil, Telugu, etc.), politely respond in English and ask them to speak in English. Use your tools to answer questions. For navigation inside the B-Block, use the `getNavigationPath` tool. To close the map view, use the `closeMapView` tool. For any factual questions about the college (like departments, admissions, facilities, etc.), you MUST use the `getCollegeInfo` tool to retrieve information from the knowledge base. Do not answer from general knowledge. After using a tool, synthesize the information into a concise, conversational answer. If a user asks a general question, gently guide the conversation back to topics related to the college.',
        },
        callbacks: {
            onopen: () => {
                setConversationState(ConversationState.LISTENING);
                const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                streamSourceRef.current = source;
                const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
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
                                if(path) {
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
                        if(lastToolResponseImageRef.current) {
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

  const handleUserDetected = useCallback(() => {
    setIsUserPresent(true);
    if (deactivationTimerRef.current) {
        clearTimeout(deactivationTimerRef.current);
        deactivationTimerRef.current = null;
    }
    if (!isAssistantActive) {
      setAssistantActive(true);
    }
  }, [isAssistantActive]);

  const handleUserNotDetected = useCallback(() => {
    setIsUserPresent(false);
    if (isAssistantActive && !deactivationTimerRef.current) {
        deactivationTimerRef.current = window.setTimeout(() => {
            endConversation();
            setAssistantActive(false);
            deactivationTimerRef.current = null;
        }, DEACTIVATION_TIMEOUT_MS);
    }
  }, [isAssistantActive, endConversation]);


  useEffect(() => {
    if (isAssistantActive && conversationState === ConversationState.IDLE) {
      handleToggleConversation();
    }
  }, [isAssistantActive, conversationState, handleToggleConversation]);

  if (route === '#/admin') {
    return <Admin />;
  }

  return (
    <>
      <UserDetector onUserDetected={handleUserDetected} onUserNotDetected={handleUserNotDetected} />
      <UserPresenceIndicator isPresent={isUserPresent} />

      {!isAssistantActive ? (
        <IdleView />
      ) : (
        <div className="relative w-screen h-screen overflow-hidden animate-fade-slide-in-bottom">
          {navigationPath && (
            <MapView 
              path={navigationPath} 
              floorPlans={floorPlans} 
              nodes={nodes}
              onClose={() => setNavigationPath(null)}
            />
          )}

          {/* Main content area */}
          <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
            {/* Visualizer occupies the main space, pushing transcript and controls down */}
            <div className="w-full flex-grow flex items-center justify-center">
                <Visualizer state={conversationState} />
            </div>

            {/* Floating Transcript */}
            <div className="absolute bottom-32 left-0 right-0 h-1/3 p-4">
                 <Transcript messages={messages} />
            </div>

            {/* Error message area */}
            {error && 
                <div className="absolute bottom-24 w-full text-center p-2">
                    <p className="text-red-400 bg-black/50 rounded-md inline-block px-4 py-2">{error}</p>
                </div>
            }

            {/* Controls are fixed at the bottom */}
            <div className="w-full flex-shrink-0">
              <Controls onToggle={handleToggleConversation} state={conversationState} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;