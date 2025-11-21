import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface TranscriptProps {
  messages: Message[];
}

const Transcript: React.FC<TranscriptProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4 scroll-smooth"
      style={{
        maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
      }}
    >
      {messages.length > 0 && (
        messages.map((msg, index) => {
          const isLastMessage = index === messages.length - 1;
          return (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} ${isLastMessage ? 'animate-spring-up' : ''}`}>
            <div
                className={`max-w-xl px-4 py-2 rounded-2xl flex flex-col backdrop-blur-sm
                ${
                msg.role === 'user'
                    ? 'bg-blue-600/80 text-white rounded-br-none'
                    : 'bg-gray-700/80 text-gray-200 rounded-bl-none'
                }`}
            >
                <p>{msg.text}</p>
                {msg.imageUrl && (
                    <img 
                        src={msg.imageUrl} 
                        alt={msg.imageAlt || 'Assistant provided image'} 
                        className="mt-2 rounded-lg max-w-xs h-auto"
                    />
                )}
            </div>
            </div>
          )
        })
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default Transcript;