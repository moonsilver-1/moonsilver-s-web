import React from 'react';

interface GoalkeeperProps {
  dive: 'left' | 'right' | 'center' | null;
  animating: boolean;
  goalWidth: number;
  goalHeight: number;
}

export const Goalkeeper: React.FC<GoalkeeperProps> = ({
  dive,
  animating,
  goalWidth,
  goalHeight,
}) => {
  const bodyW = 44;
  const bodyH = 60;
  const centerX = goalWidth / 2;
  const baseY = goalHeight - bodyH - 4;

  let translateX = 0;
  let translateY = 0;
  let rotate = 0;

  if (animating && dive) {
    if (dive === 'left') {
      translateX = -(goalWidth * 0.38);
      translateY = goalHeight * 0.28;
      rotate = -50;
    } else if (dive === 'right') {
      translateX = goalWidth * 0.38;
      translateY = goalHeight * 0.28;
      rotate = 50;
    } else {
      // center — jump up
      translateY = -(goalHeight * 0.22);
    }
  }

  const transition = animating
    ? 'transform 0.35s cubic-bezier(0.22,1,0.36,1)'
    : 'none';

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX - bodyW / 2,
        top: baseY,
        width: bodyW,
        height: bodyH,
        transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`,
        transition,
        transformOrigin: 'center bottom',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Goalkeeper SVG */}
      <svg width={bodyW} height={bodyH} viewBox="0 0 44 60">
        {/* Jersey */}
        <rect x="8" y="20" width="28" height="26" rx="4" fill="#f59e0b" />
        {/* Number */}
        <text x="22" y="37" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">1</text>
        {/* Head */}
        <circle cx="22" cy="13" r="11" fill="#fcd5a0" />
        {/* Hair */}
        <ellipse cx="22" cy="4" rx="11" ry="5" fill="#92400e" />
        {/* Left arm */}
        <rect x="0" y="22" width="10" height="6" rx="3" fill="#fcd5a0" />
        {/* Right arm */}
        <rect x="34" y="22" width="10" height="6" rx="3" fill="#fcd5a0" />
        {/* Gloves */}
        <rect x="-2" y="20" width="9" height="8" rx="4" fill="#16a34a" />
        <rect x="37" y="20" width="9" height="8" rx="4" fill="#16a34a" />
        {/* Left leg */}
        <rect x="10" y="44" width="10" height="14" rx="4" fill="#1e40af" />
        {/* Right leg */}
        <rect x="24" y="44" width="10" height="14" rx="4" fill="#1e40af" />
        {/* Boots */}
        <rect x="8" y="54" width="13" height="6" rx="3" fill="#111827" />
        <rect x="23" y="54" width="13" height="6" rx="3" fill="#111827" />
      </svg>
    </div>
  );
};
