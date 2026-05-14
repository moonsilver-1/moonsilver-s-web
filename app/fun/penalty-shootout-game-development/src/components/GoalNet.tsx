import React from 'react';

interface GoalNetProps {
  width: number;
  height: number;
}

export const GoalNet: React.FC<GoalNetProps> = ({ width, height }) => {
  const netLines: React.ReactNode[] = [];
  const cols = 12;
  const rows = 8;

  // Vertical net lines
  for (let i = 1; i < cols; i++) {
    const x = (i / cols) * width;
    netLines.push(
      <line
        key={`v${i}`}
        x1={x} y1={0} x2={x} y2={height}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
    );
  }
  // Horizontal net lines
  for (let i = 1; i < rows; i++) {
    const y = (i / rows) * height;
    netLines.push(
      <line
        key={`h${i}`}
        x1={0} y1={y} x2={width} y2={y}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* Net background */}
      <rect width={width} height={height} fill="rgba(0,0,0,0.25)" />
      {netLines}
      {/* Goal frame */}
      <rect
        x={1} y={1}
        width={width - 2} height={height - 2}
        fill="none"
        stroke="white"
        strokeWidth="4"
        rx="2"
      />
    </svg>
  );
};
