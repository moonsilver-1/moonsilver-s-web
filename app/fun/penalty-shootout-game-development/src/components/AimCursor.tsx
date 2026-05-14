import React from 'react';

interface AimCursorProps {
  x: number; // 0-1 relative
  y: number; // 0-1 relative
  goalWidth: number;
  goalHeight: number;
  visible: boolean;
}

export const AimCursor: React.FC<AimCursorProps> = ({
  x,
  y,
  goalWidth,
  goalHeight,
  visible,
}) => {
  if (!visible) return null;

  const px = x * goalWidth;
  const py = y * goalHeight;
  const r = 22;

  return (
    <svg
      width={goalWidth}
      height={goalHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {/* Outer ring */}
      <circle
        cx={px}
        cy={py}
        r={r}
        fill="none"
        stroke="rgba(239,68,68,0.9)"
        strokeWidth="2.5"
        strokeDasharray="6 4"
      />
      {/* Inner dot */}
      <circle cx={px} cy={py} r={4} fill="rgba(239,68,68,0.9)" />
      {/* Crosshair lines */}
      <line
        x1={px - r - 6} y1={py}
        x2={px - r + 8} y2={py}
        stroke="rgba(239,68,68,0.9)" strokeWidth="2"
      />
      <line
        x1={px + r - 8} y1={py}
        x2={px + r + 6} y2={py}
        stroke="rgba(239,68,68,0.9)" strokeWidth="2"
      />
      <line
        x1={px} y1={py - r - 6}
        x2={px} y2={py - r + 8}
        stroke="rgba(239,68,68,0.9)" strokeWidth="2"
      />
      <line
        x1={px} y1={py + r - 8}
        x2={px} y2={py + r + 6}
        stroke="rgba(239,68,68,0.9)" strokeWidth="2"
      />
    </svg>
  );
};
