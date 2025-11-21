import React from 'react';

interface UserPresenceIndicatorProps {
  isPresent: boolean;
}

const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({ isPresent }) => {
  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 h-1 bg-cyan-400 transition-opacity duration-500 ease-in-out z-50 ${isPresent ? 'opacity-100' : 'opacity-0'}`}
        style={{
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.7), 0 0 20px rgba(56, 189, 248, 0.5)',
        }}
        aria-hidden="true"
      />
      <div className="sr-only" aria-live="polite" role="status">
        {isPresent ? "User detected" : "No user detected"}
      </div>
    </>
  );
};
export default UserPresenceIndicator;
