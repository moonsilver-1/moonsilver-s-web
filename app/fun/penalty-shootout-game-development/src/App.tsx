/* eslint-disable @typescript-eslint/no-unused-vars */
import { useGameState } from './hooks/useGameState';
import { Pitch } from './components/Pitch';
import { PowerMeter } from './components/PowerMeter';
import { ScoreBoard } from './components/ScoreBoard';
import { Menu } from './components/Menu';
import { GameOver } from './components/GameOver';

export default function App() {
  const { state, shoot, startGame, nextRound, goToMenu, setAim } = useGameState();

  const isPowerLocked =
    state.phase !== 'shooting' || !state.isPlayerTurn;
  const showPowerMeter =
    state.phase === 'shooting' ||
    state.phase === 'ball_flying' ||
    state.phase === 'result';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #0a2e1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background stars */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              borderRadius: '50%',
              background: 'white',
              opacity: Math.random() * 0.4 + 0.1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* MENU */}
      {state.phase === 'menu' && (
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInScale 0.4s ease' }}>
          <Menu onStart={startGame} />
        </div>
      )}

      {/* GAME OVER */}
      {state.phase === 'game_over' && (
        <div style={{ position: 'relative', zIndex: 1, animation: 'bounceIn 0.5s ease' }}>
          <GameOver
            playerScore={state.playerScore}
            cpuScore={state.cpuScore}
            roundHistory={state.roundHistory}
            onPlayAgain={startGame}
            onMenu={goToMenu}
            isSuddenDeath={state.isSuddenDeath}
          />
        </div>
      )}

      {/* GAME */}
      {(state.phase === 'shooting' ||
        state.phase === 'ball_flying' ||
        state.phase === 'result' ||
        state.phase === 'round_end') && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            animation: 'slideDown 0.3s ease',
          }}
        >
          {/* Scoreboard */}
          <ScoreBoard
            playerScore={state.playerScore}
            cpuScore={state.cpuScore}
            currentRound={state.currentRound}
            maxRounds={state.maxRounds}
            isSuddenDeath={state.isSuddenDeath}
            roundHistory={state.roundHistory}
            isPlayerTurn={state.isPlayerTurn}
          />

          {/* Main game area */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {/* Power meter on left */}
            {showPowerMeter && state.isPlayerTurn && (
              <div style={{ paddingTop: 30 }}>
                <PowerMeter power={state.power} locked={isPowerLocked} />
              </div>
            )}

            {/* Pitch */}
            <div>
              <Pitch
                phase={state.phase}
                aimX={state.aimX}
                aimY={state.aimY}
                ballX={state.ballX}
                ballY={state.ballY}
                ballAnimating={state.ballAnimating}
                goalkeeperDive={state.goalkeeperDive}
                shotResult={state.shotResult}
                showResultText={state.showResultText}
                isPlayerTurn={state.isPlayerTurn}
                onAimMove={setAim}
                onShoot={shoot}
              />
            </div>

            {/* Right spacer when power meter is shown */}
            {showPowerMeter && state.isPlayerTurn && (
              <div style={{ width: 56 }} />
            )}
          </div>

          {/* Round end continue button */}
          {state.phase === 'round_end' && (
            <div style={{ animation: 'fadeInScale 0.3s ease' }}>
              <button
                onClick={nextRound}
                style={{
                  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                  border: 'none',
                  borderRadius: 50,
                  padding: '14px 40px',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'white',
                  cursor: 'pointer',
                  letterSpacing: 1,
                  boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                ▶ Next Round
              </button>
            </div>
          )}

          {/* Turn indicator */}
          {(state.phase === 'shooting' || state.phase === 'ball_flying') && (
            <div
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              {state.isPlayerTurn ? (
                <span style={{ color: '#60a5fa' }}>🧑 Your turn to shoot</span>
              ) : (
                <span style={{ color: '#f87171' }}>🤖 CPU is taking a penalty</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
