import React from 'react';

interface PowerMeterProps {
  power: number; // 0–100
  locked: boolean;
}

export const PowerMeter: React.FC<PowerMeterProps> = ({ power, locked }) => {
  const getColor = () => {
    if (power < 35) return '#22c55e';
    if (power < 65) return '#eab308';
    return '#ef4444';
  };

  const getLabel = () => {
    if (power < 30) return 'Weak';
    if (power < 55) return 'Good';
    if (power < 75) return 'Strong';
    return 'MAX!';
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="text-[var(--app-fg)] text-sm font-bold tracking-widest uppercase opacity-80">
        Power
      </div>
      <div
        className="relative w-14 rounded-full overflow-hidden border-2 border-[var(--app-border-strong)]"
        style={{ height: 160, background: 'rgba(0,0,0,0.45)' }}
      >
        {/* Fill from bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${power}%`,
            background: `linear-gradient(to top, ${getColor()}, ${getColor()}88)`,
            transition: locked ? 'none' : 'height 0.05s linear',
            boxShadow: `0 0 12px ${getColor()}`,
          }}
        />
        {/* Tick marks */}
        {[25, 50, 75].map((tick) => (
          <div
            key={tick}
            style={{
              position: 'absolute',
              bottom: `${tick}%`,
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
        {/* Value text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 13,
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}
          >
            {Math.round(power)}%
          </span>
        </div>
      </div>
      <div
        style={{
          color: getColor(),
          fontWeight: 'bold',
          fontSize: 13,
          textShadow: `0 0 8px ${getColor()}`,
          letterSpacing: 1,
          minHeight: 20,
        }}
      >
        {locked ? '🔒 ' + getLabel() : getLabel()}
      </div>
    </div>
  );
};
