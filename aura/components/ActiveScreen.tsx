import React from 'react';
import { motion } from 'framer-motion';
import { VoiceState } from '../types';
import { VoiceVisualizer } from './VoiceVisualizer';
import { SPRING_PRIMARY } from '../constants';

interface ActiveScreenProps {
  voiceState: VoiceState;
  currentTranscript: string;
  lastResponse: string;
}

export const ActiveScreen: React.FC<ActiveScreenProps> = ({ voiceState, currentTranscript, lastResponse }) => {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={SPRING_PRIMARY}
      className="w-full h-full flex flex-col items-center justify-between py-24 px-8 relative z-10 pointer-events-none"
    >
      {/* Top Spacer / Greeting Area */}
      <div className="flex-1 flex flex-col justify-end items-center pb-12 w-full max-w-2xl text-center">
        
        {/* User Transcript (Live) */}
        {currentTranscript && voiceState !== VoiceState.ERROR && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-panel px-8 py-6 rounded-3xl"
          >
            <p className="text-2xl font-medium text-white/90 leading-relaxed">
              "{currentTranscript}"
            </p>
          </motion.div>
        )}

        {/* Assistant Response */}
        <motion.div
          layout
          className="w-full"
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white drop-shadow-lg">
           {voiceState === VoiceState.ERROR 
             ? "Microphone Access Needed" 
             : (lastResponse || "How can I help you?")}
          </h1>
        </motion.div>
      </div>

      {/* Visualizer Area */}
      <div className="flex-[1.5] flex flex-col items-center justify-center relative">
        <VoiceVisualizer state={voiceState} />
        
        {/* Status Indicator Text */}
        <motion.p
          key={voiceState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          className="mt-12 text-sm font-medium uppercase tracking-[0.2em] text-white"
        >
          {voiceState === VoiceState.LISTENING ? 'Listening...' : 
           voiceState === VoiceState.THINKING ? 'Thinking...' : 
           voiceState === VoiceState.SPEAKING ? 'Speaking' :
           'Tap screen to retry'}
        </motion.p>
      </div>
    </motion.div>
  );
};