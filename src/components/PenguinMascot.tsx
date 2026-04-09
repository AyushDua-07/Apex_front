import React from 'react';

interface Props {
  state: 'idle' | 'watching' | 'covering' | 'shaking' | 'happy';
}

const PenguinMascot: React.FC<Props> = ({ state }) => {
  const getAnimationClass = () => {
    switch (state) {
      case 'idle': return 'animate-bounce-gentle';
      case 'watching': return 'animate-look';
      case 'covering': return '';
      case 'shaking': return 'animate-shake';
      case 'happy': return 'animate-bounce-gentle';
      default: return '';
    }
  };

  return (
    <div className={`flex justify-center mb-6 ${getAnimationClass()}`}>
      <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <ellipse cx="60" cy="90" rx="40" ry="45" fill="#1B3A5C" />
        {/* Belly */}
        <ellipse cx="60" cy="95" rx="28" ry="35" fill="white" />
        {/* Head */}
        <circle cx="60" cy="45" r="30" fill="#1B3A5C" />
        {/* Face */}
        <ellipse cx="60" cy="50" rx="20" ry="18" fill="white" />
        {/* Eyes */}
        {state === 'covering' ? (
          <>
            {/* Flippers covering eyes */}
            <ellipse cx="40" cy="45" rx="18" ry="10" fill="#1B3A5C" transform="rotate(-15 40 45)" />
            <ellipse cx="80" cy="45" rx="18" ry="10" fill="#1B3A5C" transform="rotate(15 80 45)" />
          </>
        ) : (
          <>
            {/* Left eye */}
            <circle cx="50" cy="44" r="5" fill="#1B3A5C" />
            <circle cx="51" cy="43" r="2" fill="white" />
            {/* Right eye */}
            <circle cx="70" cy="44" r="5" fill="#1B3A5C" />
            <circle cx="71" cy="43" r="2" fill="white" />
            {/* Flippers at sides */}
            <ellipse cx="22" cy="85" rx="10" ry="22" fill="#1B3A5C" transform="rotate(15 22 85)" />
            <ellipse cx="98" cy="85" rx="10" ry="22" fill="#1B3A5C" transform="rotate(-15 98 85)" />
          </>
        )}
        {/* Beak */}
        <path d="M55 52 L60 58 L65 52" fill="#F59E0B" />
        {/* Bow tie */}
        <path d="M48 68 L60 73 L72 68 L60 78 Z" fill="#2563EB" />
        {/* Feet */}
        <ellipse cx="45" cy="133" rx="12" ry="5" fill="#F59E0B" />
        <ellipse cx="75" cy="133" rx="12" ry="5" fill="#F59E0B" />
        {/* Rosy cheeks when happy */}
        {state === 'happy' && (
          <>
            <circle cx="42" cy="54" r="5" fill="#FDA4AF" opacity="0.6" />
            <circle cx="78" cy="54" r="5" fill="#FDA4AF" opacity="0.6" />
          </>
        )}
      </svg>
    </div>
  );
};

export default PenguinMascot;
