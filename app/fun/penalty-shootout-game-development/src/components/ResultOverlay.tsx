import React from 'react';

interface ResultOverlayProps {
  result: 'goal' | 'saved' | 'miss' | null;
  isPlayerTurn: boolean;
  visible: boolean;
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({
  result,
  isPlayerTurn,
  visible,
}) => {
  if (!visible || !result) return null;

  let emoji = '';
  let line1 = '';
  let line2 = '';
  let color = '#22c55e';
  let bg = 'rgba(34,197,94,0.15)';

  if (isPlayerTurn) {
    if (result === 'goal') {
      emoji = '⚽';
      line1 = 'GOAL!';
      line2 = 'What a shot!';
      color = '#22c55e';
      bg = 'rgba(34,197,94,0.15)';
    } else if (result === 'saved') {
      emoji = '🧤';
      line1 = 'SAVED!';
      line2 = 'The keeper got it!';
      color = '#ef4444';
      bg = 'rgba(239,68,68,0.15)';
    } else {
      emoji = '😬';
      line1 = 'MISSED!';
      line2 = 'Off target!';
      color = '#f59e0b';
      bg = 'rgba(245,158,11,0.15)';
    }
  } else {
    if (result === 'goal') {
      emoji = '😰';
      line1 = 'CPU SCORES!';
      line2 = 'The CPU equalizes!';
      color = '#ef4444';
      bg = 'rgba(239,68,68,0.15)';
    } else if (result === 'saved') {
      emoji = '🙌';
      line1 = 'GREAT SAVE!';
      line2 = 'You stopped it!';
      color = '#22c55e';
      bg = 'rgba(34,197,94,0.15)';
    } else {
      emoji = '🎉';
      line1 = 'CPU MISSED!';
      line2 = 'Off the mark!';
      color = '#22c55e';
      bg = 'rgba(34,197,94,0.15)';
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        pointerEvents: 'none',
        animation: 'fadeInScale 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
      }}
    >
      <div
        style={{
          background: bg,
          border: `2px solid ${color}`,
          borderRadius: 20,
          padding: '24px 40px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          boxShadow: `0 0 40px ${color}55`,
        }}
      >
        <div style={{ fontSize: 52 }}>{emoji}</div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color,
            letterSpacing: 3,
            textShadow: `0 0 20px ${color}`,
            lineHeight: 1.1,
          }}
        >
          {line1}
        </div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
          {line2}
        </div>
      </div>
    </div>
  );
};
