"use client";

import dynamic from "next/dynamic";

const WolfChickenClient = dynamic(() => import("./wolf-chicken-client"), { ssr: false });

export default function WolfChickenPage() {
  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════════
           狼鸡杀 · Scoped Styles
           ═══════════════════════════════════════════════════ */
        .wolf-chicken-game {
          position: fixed;
          inset: 0;
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--app-bg);
          color: var(--app-fg);
          overflow: hidden;
          user-select: none;
          z-index: 40;
        }

        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(212,168,67,0.4); }
          50% { box-shadow: 0 0 20px rgba(212,168,67,0.8); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes cardFly {
          0% { opacity: 0; transform: translateY(40px) scale(0.7); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hpDrop {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }

        .wc-card {
          position: relative;
          width: 76px;
          height: 108px;
          flex-shrink: 0;
          border-radius: 10px;
          background: linear-gradient(145deg, #faf6f0, #e8e0d4);
          border: 2px solid #2a2a2a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
          transform-origin: bottom center;
          box-shadow: 0 3px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6);
          user-select: none;
        }
        .wc-card:hover {
          transform: translateY(-10px) scale(1.05);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6);
        }
        .wc-card.sel {
          transform: translateY(-14px) scale(1.08);
          box-shadow: 0 0 0 3px rgba(200,50,50,0.5), 0 8px 24px rgba(200,50,50,0.2);
          border-color: #c22;
        }
        .wc-card-played {
          animation: cardFly 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .wc-card-back {
          background: linear-gradient(145deg, #2a3a2a, #1a2a1a);
          border-color: #0f1f0f;
        }
        .wc-card-suit {
          font-size: 20px;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .wc-card-rank {
          font-size: 22px;
          font-weight: 800;
          line-height: 1;
        }
        .wc-card-name {
          font-size: 11px;
          margin-top: 4px;
          text-align: center;
          padding: 0 3px;
          font-weight: 600;
          color: #3a3a3a;
        }

        .wc-btn {
          padding: 10px 22px;
          font-size: 14px;
          letter-spacing: 2px;
          border: 2px solid;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.12s;
          box-shadow: 0 4px 0 rgba(0,0,0,0.18);
          background: transparent;
          font-weight: 600;
        }
        .wc-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 rgba(0,0,0,0.18); }
        .wc-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.18); }

        .wc-avatar {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 3px solid var(--app-border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          background: var(--app-surface);
          transition: all 0.3s;
          position: relative;
        }
        .wc-avatar.dead {
          opacity: 0.35;
          filter: grayscale(1);
        }
        .wc-avatar.current {
          border-color: #d4a843;
          box-shadow: 0 0 16px rgba(212,168,67,0.45);
          animation: pulseGlow 2s infinite;
        }
        .wc-avatar.targetable {
          border-color: #44aa44;
          box-shadow: 0 0 12px rgba(68,170,68,0.4);
          cursor: pointer;
        }
        .wc-avatar.targetable:hover {
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(68,170,68,0.6);
        }
        .wc-avatar.selected-target {
          border-color: #c22;
          box-shadow: 0 0 16px rgba(200,50,50,0.5);
          transform: scale(1.1);
        }

        .wc-hp-bar {
          display: flex;
          gap: 3px;
          margin-top: 5px;
        }
        .wc-hp-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #c22;
          border: 1px solid #811;
          transition: all 0.4s;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);
        }
        .wc-hp-dot.lost {
          background: #444;
          border-color: #555;
          box-shadow: none;
        }
        .wc-hp-dot.damaged {
          animation: hpDrop 0.4s ease;
          background: #ff4444;
        }

        .damage-float {
          position: absolute;
          pointer-events: none;
          font-weight: 900;
          font-size: 28px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
          animation: floatUp 1.2s ease-out forwards;
          z-index: 100;
        }
        .turn-notice {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 36px;
          font-weight: 900;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
          animation: slideIn 0.5s ease-out, floatUp 1.5s ease-out 1s forwards;
          pointer-events: none;
          z-index: 100;
          white-space: nowrap;
        }
      `}</style>
      <WolfChickenClient />
    </>
  );
}
