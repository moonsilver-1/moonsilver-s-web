import React from 'react';

interface MenuProps {
  onStart: () => void;
}

export const Menu: React.FC<MenuProps> = ({ onStart }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 640,
        padding: '40px 32px',
        textAlign: 'center',
        color: 'var(--app-fg)',
      }}
    >
      {/* Stadium lights effect */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ fontSize: 72, marginBottom: 8 }}>⚽</div>
      <h1
        style={{
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: 2,
          background: 'linear-gradient(135deg, var(--app-fg) 0%, #059669 50%, #16a34a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          lineHeight: 1,
        }}
      >
        PENALTY
      </h1>
      <h1
        style={{
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: 2,
          background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 24,
          lineHeight: 1,
        }}
      >
        SHOOTOUT
      </h1>

      <p
        style={{
          fontSize: 16,
          opacity: 0.75,
          marginBottom: 40,
          lineHeight: 1.6,
          maxWidth: 380,
          margin: '0 auto 40px',
        }}
      >
        5 penalty kicks each. Move your cursor to aim, lock the power meter, and shoot.
        Can you beat the CPU goalkeeper?
      </p>

      {/* Instructions */}
      <div
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 36,
          textAlign: 'left',
          display: 'inline-block',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 2,
            opacity: 0.6,
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          How to Play
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '🖱️', text: 'Move cursor inside the goal to aim' },
            { icon: '⚡', text: 'Watch the power meter oscillate' },
            { icon: '🖱️', text: 'Click to lock power and shoot!' },
            { icon: '🤖', text: 'CPU takes its shot afterward' },
            { icon: '⚽', text: 'Most goals after 5 rounds wins!' },
            { icon: '💥', text: 'Sudden death if tied after 5 rounds' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, minWidth: 28 }}>{icon}</span>
              <span style={{ fontSize: 14, opacity: 0.85 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          border: 'none',
          borderRadius: 50,
          padding: '18px 56px',
          fontSize: 20,
          fontWeight: 800,
          color: 'white',
          cursor: 'pointer',
          letterSpacing: 2,
          textTransform: 'uppercase',
          boxShadow: '0 4px 24px rgba(34,197,94,0.5), 0 1px 0 rgba(255,255,255,0.2) inset',
          transition: 'transform 0.1s, box-shadow 0.1s',
          display: 'block',
          width: '100%',
          maxWidth: 280,
          margin: '0 auto',
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        🚀 KICK OFF!
      </button>
    </div>
  );
};
