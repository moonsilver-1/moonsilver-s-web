"use client";

import { useThemeMode } from "@/app/lib/use-theme-mode";
import dynamic from "next/dynamic";

const WeiqiClient = dynamic(() => import("./weiqi-client"), { ssr: false });

export default function WeiqiPage() {
  const theme = useThemeMode();
  const isLight = theme === "light";

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════════
           围棋 · Styles（作用域于 .weiqi-game）
           ═══════════════════════════════════════════════════ */
        :root {
          --weiqi-board: ${isLight ? "#ecc888" : "#d8a24c"};
          --weiqi-line: ${isLight ? "#3a2a14" : "#2a1a06"};
          --weiqi-black: #0e0e0e;
          --weiqi-white: #f6f4ec;
          --weiqi-accent: ${isLight ? "#8a5a14" : "#e0b25c"};
          --weiqi-panel: ${isLight ? "rgba(255,250,235,.92)" : "rgba(20,16,10,.9)"};
          --weiqi-panel-border: ${isLight ? "rgba(58,42,20,.25)" : "rgba(224,178,92,.3)"};
          --weiqi-fg: ${isLight ? "#1c1a17" : "#f3ead7"};
          --weiqi-muted: ${isLight ? "#6a5a3a" : "#a89668"};
        }

        .weiqi-game {
          position: fixed;
          inset: 0;
          z-index: 40;
          font-family: system-ui, -apple-system, "LXGW WenKai", sans-serif;
          background: ${isLight ? "linear-gradient(135deg,#f7eed8,#ead9b0)" : "linear-gradient(135deg,#1a130a,#241a0c)"};
          color: var(--weiqi-fg);
          overflow: hidden;
          user-select: none;
          display: flex;
          flex-direction: column;
        }

        /* ── Topbar ── */
        .weiqi-topbar {
          position: absolute;
          top: 10px;
          right: 12px;
          display: flex;
          gap: 6px;
          z-index: 60;
        }
        .weiqi-tb {
          background: var(--weiqi-panel);
          border: 1.5px solid var(--weiqi-panel-border);
          color: var(--weiqi-muted);
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: color .15s, border-color .15s;
        }
        .weiqi-tb:hover { color: var(--weiqi-accent); border-color: var(--weiqi-accent); }

        /* ── 顶部状态条 ── */
        .weiqi-topinfo {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--weiqi-panel);
          border: 1.5px solid var(--weiqi-panel-border);
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 13px;
          z-index: 60;
          max-width: calc(100vw - 160px);
          white-space: nowrap;
          overflow: hidden;
        }
        .weiqi-topinfo-players {
          font-size: 11px;
          color: var(--weiqi-muted);
          padding-left: 8px;
          border-left: 1px solid var(--weiqi-panel-border);
        }
        .weiqi-turn-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 1px solid rgba(0,0,0,.3);
        }

        /* ── 主体布局：左棋盘 右侧栏 ── */
        .weiqi-main {
          flex: 1;
          display: flex;
          min-height: 0;
        }
        .weiqi-board-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px 8px 8px;
          min-width: 0;
        }
        .weiqi-board-wrap canvas {
          border-radius: 6px;
          box-shadow: 0 12px 40px rgba(0,0,0,.35);
        }

        /* ── 侧栏 ── */
        .weiqi-side {
          width: 280px;
          flex-shrink: 0;
          padding: 56px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          background: ${isLight ? "rgba(255,250,235,.4)" : "rgba(10,8,4,.4)"};
          border-left: 1px solid var(--weiqi-panel-border);
        }
        @media (max-width: 720px) {
          .weiqi-side {
            width: 100%;
            flex-direction: row;
            flex-wrap: wrap;
            padding: 8px;
            border-left: none;
            border-top: 1px solid var(--weiqi-panel-border);
          }
          .weiqi-main { flex-direction: column; }
          .weiqi-board-wrap { padding: 48px 4px 4px; }
        }

        .weiqi-player-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--weiqi-panel);
          border: 1.5px solid var(--weiqi-panel-border);
          border-radius: 12px;
          padding: 10px 14px;
          position: relative;
        }
        .weiqi-stone-mini {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 1px solid rgba(0,0,0,.25);
        }
        .weiqi-player-name {
          font-size: 14px;
          font-weight: 600;
        }
        .weiqi-player-stat {
          font-size: 11px;
          color: var(--weiqi-muted);
          margin-top: 2px;
        }
        .weiqi-turn-tag {
          position: absolute;
          top: 6px;
          right: 8px;
          font-size: 10px;
          color: var(--weiqi-accent);
          border: 1px solid var(--weiqi-accent);
          border-radius: 999px;
          padding: 1px 8px;
        }

        /* ── 控制区 ── */
        .weiqi-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }
        .weiqi-ctrl {
          background: var(--weiqi-panel);
          border: 1.5px solid var(--weiqi-panel-border);
          color: var(--weiqi-fg);
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all .15s;
        }
        .weiqi-ctrl:hover:not(.weiqi-ctrl-disabled) {
          border-color: var(--weiqi-accent);
          color: var(--weiqi-accent);
        }
        .weiqi-ctrl-danger {
          color: #c44;
          border-color: rgba(204,68,68,.4);
        }
        .weiqi-ctrl-danger:hover { border-color: #c44; color: #c44; }
        .weiqi-ctrl-disabled {
          opacity: .4;
          cursor: not-allowed;
        }
        .weiqi-err {
          font-size: 12px;
          color: #e66;
          text-align: center;
        }

        /* ── 死子标记面板 ── */
        .weiqi-deadmark-panel {
          background: var(--weiqi-panel);
          border: 1.5px solid var(--weiqi-accent);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .weiqi-deadmark-hint {
          font-size: 12px;
          color: var(--weiqi-muted);
          line-height: 1.6;
        }

        /* ── 覆盖层 ── */
        .weiqi-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.78);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .weiqi-result {
          background: ${isLight ? "#fff8ec" : "#1c160c"};
          border: 2px solid var(--weiqi-accent);
          border-radius: 18px;
          padding: 32px 40px;
          text-align: center;
          min-width: 320px;
          max-width: 92vw;
          box-shadow: 0 20px 60px rgba(0,0,0,.4);
        }
        .weiqi-result-cell {
          background: rgba(0,0,0,.08);
          border: 1px solid var(--weiqi-panel-border);
          border-radius: 12px;
          padding: 14px 10px;
        }
        ${isLight ? ".weiqi-result-cell { background: rgba(0,0,0,.04); }" : ""}
        .weiqi-result-label {
          font-size: 11px;
          color: var(--weiqi-muted);
          margin-bottom: 4px;
        }
        .weiqi-result-sub {
          font-size: 10px;
          color: var(--weiqi-muted);
          margin-top: 4px;
        }
        .weiqi-undo-panel {
          background: ${isLight ? "#fff8ec" : "#1c160c"};
          border: 2px solid var(--weiqi-accent);
          border-radius: 16px;
          padding: 28px 36px;
          text-align: center;
          max-width: 360px;
        }
      `}</style>
      <WeiqiClient />
    </>
  );
}
