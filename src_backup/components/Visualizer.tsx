import React from 'react';
import { ConversationState } from '../types';

interface VisualizerProps {
  state: ConversationState;
}

const Visualizer: React.FC<VisualizerProps> = ({ state }) => {
  const isSpeaking = state === ConversationState.SPEAKING;
  const isListening = state === ConversationState.LISTENING;

  return (
    <div className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80">
      {isListening && (
        <div className="absolute w-full h-full rounded-full bg-blue-500/50 animate-pulse-ring"></div>
      )}
      <div
        className={`w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900
          ${isSpeaking ? 'animate-glow' : ''}
          ${state !== ConversationState.IDLE ? 'scale-100' : 'scale-95'}`}
        style={{
          transition: 'transform var(--duration-normal) var(--ease-spring)',
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, 0.05),
            inset 0 -4px 10px rgba(0, 0, 0, 0.5),
            0 0 15px rgba(0, 0, 0, 0.5)
          `
        }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-bl from-transparent via-cyan-900/10 to-transparent">
        </div>
      </div>
    </div>
  );
};

export default Visualizer;