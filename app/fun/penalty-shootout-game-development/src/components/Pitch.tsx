import React, { useCallback, useRef } from "react";
import { GoalNet } from "./GoalNet";
import { Goalkeeper } from "./Goalkeeper";
import { AimCursor } from "./AimCursor";
import { Ball } from "./Ball";
import { ResultOverlay } from "./ResultOverlay";
import { GamePhase } from "../types/game";

const GOAL_WIDTH = 480;
const GOAL_HEIGHT = 200;
const PITCH_WIDTH = 640;
const PITCH_HEIGHT = 420;
const GOAL_LEFT = (PITCH_WIDTH - GOAL_WIDTH) / 2;
const GOAL_TOP = 40;
const BALL_START_X = PITCH_WIDTH / 2;
const BALL_START_Y = PITCH_HEIGHT - 60;

interface PitchProps {
  phase: GamePhase;
  aimX: number;
  aimY: number;
  ballX: number;
  ballY: number;
  ballAnimating: boolean;
  goalkeeperDive: "left" | "right" | "center" | null;
  shotResult: "goal" | "saved" | "miss" | null;
  showResultText: boolean;
  isPlayerTurn: boolean;
  onAimMove: (x: number, y: number) => void;
  onShoot: () => void;
  scale?: number;
}

export const GOAL_W = GOAL_WIDTH;
export const GOAL_H = GOAL_HEIGHT;
export const GOAL_L = GOAL_LEFT;
export const GOAL_T = GOAL_TOP;
export const BALL_SX = BALL_START_X;
export const BALL_SY = BALL_START_Y;
export const PITCH_W = PITCH_WIDTH;
export const PITCH_H = PITCH_HEIGHT;

export const Pitch: React.FC<PitchProps> = ({
  phase,
  aimX,
  aimY,
  ballX,
  ballY,
  ballAnimating,
  goalkeeperDive,
  shotResult,
  showResultText,
  isPlayerTurn,
  onAimMove,
  onShoot,
  scale = 1,
}) => {
  const pitchRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (phase !== "shooting" || !isPlayerTurn) return;
      const rect = pitchRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const gx = (px - GOAL_LEFT) / GOAL_WIDTH;
      const gy = (py - GOAL_TOP) / GOAL_HEIGHT;
      const clampedX = Math.max(0.02, Math.min(0.98, gx));
      const clampedY = Math.max(0.02, Math.min(0.98, gy));
      if (gx >= 0 && gx <= 1 && gy >= 0 && gy <= 1) {
        onAimMove(clampedX, clampedY);
      }
    },
    [isPlayerTurn, onAimMove, phase],
  );

  const handleClick = useCallback(() => {
    if (phase === "shooting" && isPlayerTurn) {
      onShoot();
    }
  }, [isPlayerTurn, onShoot, phase]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (phase !== "shooting" || !isPlayerTurn) return;
      const rect = pitchRef.current?.getBoundingClientRect();
      if (!rect) return;
      const touch = e.touches[0];
      const px = touch.clientX - rect.left;
      const py = touch.clientY - rect.top;
      const gx = (px - GOAL_LEFT) / GOAL_WIDTH;
      const gy = (py - GOAL_TOP) / GOAL_HEIGHT;
      const clampedX = Math.max(0.02, Math.min(0.98, gx));
      const clampedY = Math.max(0.02, Math.min(0.98, gy));
      if (gx >= 0 && gx <= 1 && gy >= 0 && gy <= 1) {
        onAimMove(clampedX, clampedY);
      }
    },
    [isPlayerTurn, onAimMove, phase],
  );

  const isAiming = phase === "shooting" && isPlayerTurn;
  const gkAnimating = phase === "ball_flying" || phase === "result";

  return (
    <div
      style={{
        position: "relative",
        width: PITCH_WIDTH * scale,
        height: PITCH_HEIGHT * scale,
      }}
    >
      <div
        ref={pitchRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleClick}
        style={{
          position: "absolute",
          inset: 0,
          width: PITCH_WIDTH,
          height: PITCH_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          cursor: isAiming ? "none" : "default",
          userSelect: "none",
          overflow: "hidden",
          borderRadius: 16,
          boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, #166534 0%, #15803d 40%, #16a34a 100%)",
          }}
        />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${i * 12.5}%`,
              width: "12.5%",
              background: i % 2 === 0 ? "rgba(0,0,0,0.04)" : "transparent",
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            left: PITCH_WIDTH / 2 - 4,
            top: PITCH_HEIGHT - 68,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.6)",
          }}
        />

        <svg
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT}
        >
          <rect
            x={GOAL_LEFT - 40}
            y={GOAL_TOP + GOAL_HEIGHT}
            width={GOAL_WIDTH + 80}
            height={140}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2"
          />
          <rect
            x={GOAL_LEFT + 40}
            y={GOAL_TOP + GOAL_HEIGHT}
            width={GOAL_WIDTH - 80}
            height={60}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
          <path
            d={`M ${PITCH_WIDTH / 2 - 80} ${PITCH_HEIGHT - 30} A 90 90 0 0 1 ${PITCH_WIDTH / 2 + 80} ${PITCH_HEIGHT - 30}`}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
        </svg>

        <div
          style={{
            position: "absolute",
            left: GOAL_LEFT,
            top: GOAL_TOP,
            width: GOAL_WIDTH,
            height: GOAL_HEIGHT,
          }}
        >
          <GoalNet width={GOAL_WIDTH} height={GOAL_HEIGHT} />
          <Goalkeeper
            dive={goalkeeperDive}
            animating={gkAnimating}
            goalWidth={GOAL_WIDTH}
            goalHeight={GOAL_HEIGHT}
          />
          <AimCursor
            x={aimX}
            y={aimY}
            goalWidth={GOAL_WIDTH}
            goalHeight={GOAL_HEIGHT}
            visible={isAiming}
          />
        </div>

        <Ball x={ballX} y={ballY} animating={ballAnimating} />

        {isAiming ? (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.8)",
              fontSize: 13,
              fontWeight: 600,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              letterSpacing: 1,
              pointerEvents: "none",
            }}
          >
            Move to aim - Click to shoot
          </div>
        ) : null}

        {phase === "shooting" && !isPlayerTurn ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: 800,
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                animation: "pulse 1s infinite",
              }}
            >
              CPU is shooting...
            </div>
          </div>
        ) : null}

        <ResultOverlay result={shotResult} isPlayerTurn={isPlayerTurn} visible={showResultText} />
      </div>
    </div>
  );
};
