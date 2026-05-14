import React from 'react';
import { RoundScore } from '../types/game';

interface GameOverProps {
  playerScore: number;
  cpuScore: number;
  roundHistory: RoundScore[];
  onPlayAgain: () => void;
  onMenu: () => void;
  isSuddenDeath: boolean;
}

export const GameOver: React.FC<GameOverProps> = ({
  playerScore,
  cpuScore,
  roundHistory,
  onPlayAgain,
  onMenu,
  isSuddenDeath,
}) => {
  const playerWon = playerScore > cpuScore;
  const isDraw = playerScore === cpuScore;

  return (
    <div
      style={{
        color: 'var(--app-fg)',
        textAlign: 'center',
        padding: '32px 24px',
        maxWidth: 500,
        width: '100%',
      }}
    >
      {/* Result banner */}
      <div style={{ fontSize: 64, marginBottom: 8 }}>
        {isDraw ? '🤝' : playerWon ? '🏆' : '😢'}
      </div>
      <h2
        style={{
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: 2,
          background: isDraw
            ? 'linear-gradient(135deg,#94a3b8,#cbd5e1)'
            : playerWon
            ? 'linear-gradient(135deg,#fbbf24,#f97316)'
            : 'linear-gradient(135deg,#f87171,#ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 4,
        }}
      >
        {isDraw ? 'DRAW!' : playerWon ? 'YOU WIN!' : 'CPU WINS!'}
      </h2>
      {isSuddenDeath && (
        <div
          style={{
            fontSize: 13,
            opacity: 0.7,
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          After sudden death
        </div>
      )}

      {/* Score */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 20,
          margin: '20px 0',
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          borderRadius: 16,
          padding: '20px 32px',
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 4 }}>🧑 YOU</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#60a5fa' }}>{playerScore}</div>
        </div>
        <div style={{ fontSize: 28, opacity: 0.4, fontWeight: 900 }}>–</div>
        <div>
          <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 4 }}>CPU 🤖</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#f87171' }}>{cpuScore}</div>
        </div>
      </div>

      {/* Round breakdown */}
      <div
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 28,
          textAlign: 'left',
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.5, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>
          Round Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {roundHistory.map((round, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 14,
              }}
            >
              <span style={{ opacity: 0.6, minWidth: 60 }}>
                {i < 5 ? `Round ${i + 1}` : `SD ${i - 4}`}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: round.player === 'goal' ? '#22c55e' : round.player === 'saved' ? '#ef4444' : '#f59e0b' }}>
                  {round.player === 'goal' ? '⚽ GOAL' : round.player === 'saved' ? '🧤 SAVED' : '✗ MISS'}
                </span>
                <span style={{ opacity: 0.4 }}>vs</span>
                <span style={{ color: round.cpu === 'goal' ? '#ef4444' : round.cpu === 'saved' ? '#22c55e' : '#22c55e' }}>
                  {round.cpu === 'goal' ? '😰 GOAL' : round.cpu === 'saved' ? '🎉 SAVED' : '✓ MISS'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={onPlayAgain}
          style={{
            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            border: 'none',
            borderRadius: 50,
            padding: '14px 32px',
            fontSize: 16,
            fontWeight: 700,
            color: 'white',
            cursor: 'pointer',
            letterSpacing: 1,
            boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          🔄 Play Again
        </button>
        <button
          onClick={onMenu}
          style={{
            background: 'var(--app-surface)',
            border: '1px solid var(--app-border)',
            borderRadius: 50,
            padding: '14px 32px',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--app-fg)',
            cursor: 'pointer',
            letterSpacing: 1,
            transition: 'transform 0.1s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          🏠 Menu
        </button>
      </div>
    </div>
  );
};
