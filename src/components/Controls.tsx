import React from 'react';
import { ConversationState } from '../types';

// --- SVG Icons ---
const MicrophoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM11 5a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0V5Z" />
        <path d="M12 15a5 5 0 0 0 5-5V5a1 1 0 0 0-2 0v5a3 3 0 0 1-6 0V5a1 1 0 0 0-2 0v5a5 5 0 0 0 5 5Z" />
        <path d="M6 11a1 1 0 0 0-1 1v1a6 6 0 0 0 12 0v-1a1 1 0 0 0-2 0v1a4 4 0 0 1-8 0v-1a1 1 0 0 0-1-1Z" />
    </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

const VideoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
    </svg>
);

const UploadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const PauseIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

// --- Main Controls Component ---
interface ControlsProps {
  onToggle: () => void;
  state: ConversationState;
}

const ControlButton: React.FC<{children: React.ReactNode, onClick?: () => void, className?: string, 'aria-label': string, disabled?: boolean}> = 
  ({children, onClick, className, 'aria-label': ariaLabel, disabled}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`bouncy-button flex items-center justify-center w-14 h-14 rounded-full duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white/50
      ${className} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);


const Controls: React.FC<ControlsProps> = ({ onToggle, state }) => {
  const isActive = state !== ConversationState.IDLE;
  
  return (
    <div className="flex items-center justify-center w-full p-4">
      <div className="flex items-center justify-center gap-4 w-full max-w-sm bg-black/30 backdrop-blur-md rounded-full p-2">
        <ControlButton className="bg-gray-700/80 hover:bg-gray-600/80" aria-label="Toggle camera" disabled>
            <VideoIcon className="w-6 h-6 text-white"/>
        </ControlButton>
        <ControlButton className="bg-gray-700/80 hover:bg-gray-600/80" aria-label="Upload file" disabled>
            <UploadIcon className="w-6 h-6 text-white"/>
        </ControlButton>
        <ControlButton className="bg-gray-700/80 hover:bg-gray-600/80" aria-label="Pause" disabled>
            <PauseIcon className="w-6 h-6 text-white"/>
        </ControlButton>
        
        <div className="flex-grow"></div>

        <ControlButton
          onClick={onToggle}
          className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          aria-label={isActive ? 'Stop conversation' : 'Start conversation'}
        >
          {isActive ? <CloseIcon className="w-8 h-8 text-white" /> : <MicrophoneIcon className="w-8 h-8 text-white" />}
        </ControlButton>
      </div>
    </div>
  );
};

export default Controls;