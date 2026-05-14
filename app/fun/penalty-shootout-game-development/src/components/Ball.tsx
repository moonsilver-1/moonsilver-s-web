import React from 'react';

interface BallProps {
  x: number;       // pixels from left of pitch
  y: number;       // pixels from top of pitch
  animating: boolean;
}

export const Ball: React.FC<BallProps> = ({
  x, y, animating
}) => {
  const size = animating ? 22 : 32;

  // Scale down as ball travels away
  const scale = animating ? 0.55 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        transform: `scale(${scale})`,
        transition: animating
          ? 'left 0.55s cubic-bezier(0.2,0.8,0.4,1), top 0.55s cubic-bezier(0.2,0.8,0.4,1), transform 0.55s ease'
          : 'none',
        zIndex: 15,
        pointerEvents: 'none',
        filter: animating ? 'blur(0.5px)' : 'none',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs>
          <radialGradient id="ballGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cccccc" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#ballGrad)" stroke="#333" strokeWidth="1" />
        {/* Pentagon patches */}
        <polygon
          points="16,4 19.5,10 16,10 12.5,10"
          fill="#222"
          opacity="0.85"
        />
        <polygon
          points="26,12 22,14 20,11 22,8 26,8"
          fill="#222"
          opacity="0.85"
        />
        <polygon
          points="22,22 19,20 20,17 24,17 26,20"
          fill="#222"
          opacity="0.85"
        />
        <polygon
          points="10,22 8,19 10,17 14,17 13,20"
          fill="#222"
          opacity="0.85"
        />
        <polygon
          points="6,12 6,8 10,8 12,11 10,14"
          fill="#222"
          opacity="0.85"
        />
      </svg>
    </div>
  );
};
