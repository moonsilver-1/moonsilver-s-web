"use client";

import { useThemeMode } from "@/app/lib/use-theme-mode";
import dynamic from "next/dynamic";

const MahjongClient = dynamic(() => import("./mahjong-client"), { ssr: false });

export default function MahjongPage() {
  const theme = useThemeMode();
  const isLight = theme === "light";

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════════
           湖州麻将 · Styles (scoped to .mahjong-game)
           ═══════════════════════════════════════════════════ */

        :root {
          --mahjong-gold: ${isLight ? "#8a6820" : "#d4a843"};
          --mahjong-gold-dim: ${isLight ? "rgba(138,104,32,.3)" : "rgba(212,168,67,.3)"};
          --mahjong-felt: ${isLight ? "#b8c8a8" : "#4a7c59"};
          --mahjong-felt-dk: ${isLight ? "#98a888" : "#325a3e"};
          --mahjong-ivory: #f5f0e0;
          --mahjong-ivory-dk: #e0d8b8;
          --mahjong-side: #c8b882;
          --mahjong-side-dk: #7a6830;
          --mahjong-wan: #c8362a;
          --mahjong-tiao: #1e7a1e;
          --mahjong-tong: #1a4a8a;
          --mahjong-blk: #1a1a1a;
        }

        .mahjong-game {
          position: fixed;
          inset: 0;
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--mahjong-felt-dk);
          color: var(--mahjong-blk);
          overflow: hidden;
          user-select: none;
          z-index: 40;
        }

        .mahjong-game::before {
          content: '';
          position: absolute;
          inset: 0;
          background-color: var(--mahjong-felt);
          background-image:
            linear-gradient(rgba(0,0,0,${isLight ? ".04" : ".07"}) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,${isLight ? ".04" : ".07"}) 1px, transparent 1px);
          background-size: 18px 18px;
          z-index: 0;
        }

        /* ── Topbar ── */
        .mahjong-topbar {
          position: fixed;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          z-index: 50;
        }
        .mahjong-tb {
          background: rgba(0,0,0,.55);
          border: 2px solid rgba(212,168,67,.2);
          color: #888;
          font-size: 11px;
          padding: 5px 10px;
          cursor: pointer;
          letter-spacing: 1px;
        }
        .mahjong-tb:hover { color: var(--mahjong-gold); border-color: var(--mahjong-gold); }

        /* ── Grid Layout ── */
        .mahjong-grid {
          position: relative;
          z-index: 1;
          width: 100vw;
          height: 100vh;
          display: grid;
          grid-template-rows: 100px 1fr 130px;
          grid-template-columns: 100px 1fr 100px;
          grid-template-areas:
            "tl top tr"
            "lft ctr rgt"
            "bl bot br";
        }

        /* ── Zones ── */
        .mahjong-zone-top {
          grid-area: top;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: rotate(180deg);
          overflow: visible;
          padding: 4px 0;
        }
        .mahjong-zone-bottom {
          grid-area: bot;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 6px;
          overflow: visible;
        }
        .mahjong-zone-left {
          grid-area: lft;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .mahjong-zone-right {
          grid-area: rgt;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .mahjong-rotated-90 {
          transform: rotate(90deg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .mahjong-rotated-neg90 {
          transform: rotate(-90deg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .mahjong-zone-center {
          grid-area: ctr;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── HUD ── */
        .mahjong-hud {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(0,0,0,.7);
          border: 2px solid rgba(212,168,67,.25);
          padding: 4px 12px;
          font-size: 12px;
          white-space: nowrap;
        }
        .mahjong-hud-name { color: var(--mahjong-gold); font-size: 13px; }
        .mahjong-hud-score { color: #aed68a; }
        .mahjong-hud-wind {
          background: rgba(212,168,67,.18);
          border: 1px solid var(--mahjong-gold-dim);
          padding: 1px 6px;
          font-size: 11px;
          color: var(--mahjong-gold);
        }
        .mahjong-hud-dealer {
          background: var(--mahjong-wan);
          padding: 1px 6px;
          font-size: 10px;
          color: #fff;
          font-weight: 700;
        }
        .mahjong-hud-dot {
          width: 8px;
          height: 8px;
          background: #aed68a;
          box-shadow: 0 0 6px #aed68a;
          opacity: 0;
          transition: opacity .3s;
        }
        .mahjong-hud-dot.on {
          opacity: 1;
          animation: mahjong-blink 1s ease-in-out infinite;
        }
        @keyframes mahjong-blink { 0%,100%{opacity:1;} 50%{opacity:.25;} }

        /* ── Hand Rows ── */
        .mahjong-hand-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .mahjong-hand {
          display: flex;
          gap: 3px;
          align-items: flex-end;
          padding: 0 4px;
        }
        .mahjong-hand-sm { gap: 2px; }
        .mahjong-hand-xs { gap: 2px; }

        /* ── Melds ── */
        .mahjong-melds {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          flex-wrap: wrap;
          max-width: 140px;
        }
        .mahjong-meld-group {
          display: flex;
          gap: 1px;
          align-items: flex-end;
        }

        /* ── Tile ── */
        .mahjong-tile {
          position: relative;
          width: var(--tw, 56px);
          height: var(--th, 74px);
          flex-shrink: 0;
          transition: transform .14s cubic-bezier(.34,1.56,.64,1);
          transform-origin: bottom center;
        }
        .mahjong-tile-face {
          position: absolute;
          inset: 0;
          background: #fbfaf4;
          border: 2px solid #1d1d1d;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .mahjong-tile-face::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(160deg, rgba(255,255,255,.88) 0%, transparent 55%),
            linear-gradient(to bottom, rgba(0,0,0,.02) 0%, rgba(0,0,0,.05) 100%);
          pointer-events: none;
        }
        .mahjong-tile::after {
          content: '';
          position: absolute;
          right: calc(-1 * var(--td, 5px));
          bottom: calc(-1 * var(--td, 5px));
          width: var(--tw, 56px);
          height: var(--th, 74px);
          background: linear-gradient(180deg, #d8d5cd, #bdb8ab);
          border: 2px solid #8b8578;
          z-index: -1;
          clip-path: polygon(var(--td, 5px) 0%, 100% 0%, 100% 100%, 0% 100%, 0% var(--td, 5px));
        }

        /* Back tile */
        .mahjong-tile-back .mahjong-tile-face {
          background: linear-gradient(145deg, #445f4e, #1e3528);
        }
        .mahjong-tile-back::after {
          background: #213629;
          border-color: #102015;
        }

        /* Joker */
        .mahjong-tile-joker .mahjong-tile-face {
          background: linear-gradient(155deg, #ffffff, #ecebe3);
        }

        /* Selected / Clickable */
        .mahjong-tile-wrap {
          cursor: default;
          transition: transform .14s cubic-bezier(.34,1.56,.64,1);
          transform-origin: bottom center;
        }
        .mahjong-tile-wrap:hover {
          transform: translateY(-10px);
        }
        .mahjong-tile-wrap:hover .mahjong-tile-face {
          border-color: #111;
          background: #fff;
        }
        .mahjong-tile-wrap.sel {
          transform: translateY(-14px);
        }
        .mahjong-tile-wrap.sel .mahjong-tile-face {
          border-color: #111;
          background: #fff;
          box-shadow: 0 0 0 2px rgba(0,0,0,.4), 0 8px 20px rgba(0,0,0,.18);
        }
        .mahjong-tile.last-discard .mahjong-tile-face {
          border-color: #b44;
          box-shadow: 0 0 0 2px #b44;
        }

        /* ── Tile Graphics ── */
        .mahjong-tile-graphic {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 4px;
        }

        .mahjong-wan-num {
          font-weight: 900;
          font-size: calc(var(--tw, 56px) * .46);
          color: var(--mahjong-wan);
          line-height: 1;
        }
        .mahjong-wan-kanji {
          font-weight: 900;
          font-size: calc(var(--tw, 56px) * .28);
          color: var(--mahjong-wan);
          line-height: 1;
          margin-top: 1px;
        }

        .mahjong-bird {
          font-size: calc(var(--tw, 56px) * .46);
          line-height: 1;
          color: var(--mahjong-tiao);
        }
        .mahjong-tiao-wrap {
          width: 84%;
          height: 80%;
        }
        .mahjong-pattern-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          place-items: center;
          gap: 0;
        }
        .mahjong-stick {
          width: calc(var(--tw, 56px) * .075);
          height: calc(var(--th, 74px) * .22);
          background: linear-gradient(to right, #197219, #45bf45, #197219);
          border-radius: 999px;
          border: 1.4px solid #0f5e0f;
          flex-shrink: 0;
          position: relative;
        }
        .mahjong-stick-red {
          background: linear-gradient(to right, #1a7a1a, #49c249, #1a7a1a);
          border-color: #105610;
        }
        .mahjong-stick-red::after {
          content: '';
          position: absolute;
          inset: 20% 36%;
          border-radius: 999px;
          background: #b11f1f;
        }
        .mahjong-stick::before {
          content: '';
          position: absolute;
          left: 40%;
          top: 10%;
          bottom: 10%;
          width: 1px;
          background: rgba(255,255,255,.7);
        }

        .mahjong-tong-wrap {
          width: 84%;
          height: 82%;
        }
        .mahjong-dot {
          position: relative;
          width: calc(var(--tw, 56px) * .19);
          height: calc(var(--tw, 56px) * .19);
          border-radius: 50%;
          background: #fff;
          border: 1.4px solid #143a86;
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1.5px rgba(122,192,248,.28);
        }
        .mahjong-dot-center {
          background: #fff;
          border-color: #7a1010;
        }
        .mahjong-dot-center::after {
          content: '';
          position: absolute;
          inset: 24%;
          border-radius: 50%;
          background: #d82626;
        }
        .mahjong-dot::before {
          content: '';
          position: absolute;
          inset: 11%;
          border-radius: 50%;
          border: 1px solid rgba(26,74,138,.45);
        }

        .mahjong-honor-char {
          font-weight: 900;
          font-size: calc(var(--tw, 56px) * .48);
          line-height: 1;
          text-shadow: 1px 1px 0 rgba(255,255,255,.9);
          color: var(--mahjong-blk);
        }
        .mahjong-h-E, .mahjong-h-S, .mahjong-h-W, .mahjong-h-N { color: var(--mahjong-blk); }
        .mahjong-h-Z { color: var(--mahjong-wan); }
        .mahjong-h-F { color: var(--mahjong-tiao); }
        .mahjong-h-P { color: #888; }

        .mahjong-joker-tag {
          position: absolute;
          top: 2px;
          left: 3px;
          font-size: 9px;
          font-weight: 700;
          color: var(--mahjong-wan);
          line-height: 1;
        }
        .mahjong-joker-sub {
          font-size: calc(var(--tw, 56px) * .18);
          color: #888;
          margin-top: 1px;
        }

        /* ── Center Box ── */
        .mahjong-center-box {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-rows: 1fr auto 1fr;
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas:
            "dn dn dn"
            "dw ci de"
            "ds ds ds";
          gap: 3px;
          padding: 6px;
          justify-items: center;
          align-items: center;
        }
        .mahjong-disc-top { grid-area: dn; }
        .mahjong-disc-left { grid-area: dw; }
        .mahjong-disc-right { grid-area: de; }
        .mahjong-disc-bottom { grid-area: ds; }
        .mahjong-center-info { grid-area: ci; display: flex; flex-direction: column; align-items: center; justify-content: center; }

        .mahjong-disc-zone {
          display: flex;
          gap: 2px;
          overflow: visible;
        }
        .mahjong-disc-top,
        .mahjong-disc-bottom {
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          width: min(100%, 340px);
          max-width: 340px;
          justify-self: center;
        }
        .mahjong-disc-left,
        .mahjong-disc-right {
          flex-direction: column;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          max-height: 240px;
          width: max-content;
          gap: 2px;
        }
        .mahjong-disc-zone .mahjong-tile { cursor: default !important; }
        .mahjong-disc-zone .mahjong-tile:hover { transform: none !important; }

        .mahjong-disc-top { align-self: end; }
        .mahjong-disc-bottom { align-self: start; }
        .mahjong-disc-left { justify-self: end; }
        .mahjong-disc-right { justify-self: start; }

        .mahjong-round-badge {
          background: rgba(0,0,0,.65);
          border: 2px solid var(--mahjong-gold-dim);
          padding: 6px 12px;
          text-align: center;
          min-width: 80px;
        }

        /* ── Action Bar ── */
        .mahjong-action-bar {
          position: fixed;
          bottom: 140px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 200;
        }
        .mahjong-ab {
          padding: 9px 22px;
          font-size: 15px;
          letter-spacing: 3px;
          border: 3px solid;
          cursor: pointer;
          transition: all .08s;
          box-shadow: 3px 3px 0 rgba(0,0,0,.3);
        }
        .mahjong-ab:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 rgba(0,0,0,.3); }
        .mahjong-ab:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 rgba(0,0,0,.3); }
        .mahjong-ab-hu { background: #7a1008; border-color: #ff4444; color: #ff9988; }
        .mahjong-ab-peng { background: #08204a; border-color: #4488ff; color: #88aaff; }
        .mahjong-ab-chi { background: #082818; border-color: #44cc44; color: #88ee88; }
        .mahjong-ab-gang { background: #4a2800; border-color: var(--mahjong-gold); color: var(--mahjong-gold); }
        .mahjong-ab-pass { background: #1a1a1a; border-color: #333; color: #555; }
        .mahjong-ab-discard { background: #4a3800; border-color: var(--mahjong-gold); color: var(--mahjong-gold); }

        /* ── Chi Panel ── */
        .mahjong-chi-panel {
          position: fixed;
          bottom: 210px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(22,34,20,.95);
          border: 3px solid var(--mahjong-gold);
          padding: 12px 18px;
          z-index: 210;
          box-shadow: 4px 4px 0 rgba(0,0,0,.3);
        }
        .mahjong-chi-opt {
          display: flex;
          gap: 2px;
          cursor: pointer;
          padding: 4px;
          border: 2px solid #2a4a2a;
          transition: border-color .1s;
        }
        .mahjong-chi-opt:hover { border-color: var(--mahjong-gold); }

        /* ── Log ── */
        .mahjong-log {
          position: fixed;
          left: 6px;
          bottom: 140px;
          width: 160px;
          max-height: 120px;
          overflow: hidden;
          background: rgba(0,0,0,.5);
          border: 2px solid rgba(212,168,67,.1);
          padding: 6px 8px;
          z-index: 50;
          font-size: 10px;
        }
        .mahjong-log-entry {
          color: #666;
          margin-bottom: 3px;
          padding-bottom: 3px;
          border-bottom: 1px solid #1a2a1a;
        }
        .mahjong-log-entry span { color: #b89a40; }

        /* ── Notification ── */
        .mahjong-notif {
          position: fixed;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,.85);
          border: 3px solid var(--mahjong-gold);
          box-shadow: 3px 3px 0 rgba(0,0,0,.3);
          padding: 8px 22px;
          font-size: 16px;
          color: var(--mahjong-gold);
          z-index: 400;
          pointer-events: none;
          letter-spacing: 2px;
          white-space: nowrap;
          animation: mahjong-notif-in .2s ease-out;
        }
        @keyframes mahjong-notif-in { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        /* ── Overlay ── */
        .mahjong-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.82);
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Result Panel ── */
        .mahjong-result-panel {
          background: rgba(22,34,20,.97);
          border: 3px solid var(--mahjong-gold);
          box-shadow: 6px 6px 0 rgba(0,0,0,.3);
          padding: 32px 40px;
          min-width: 340px;
          text-align: center;
        }

        /* ── Rules Panel ── */
        .mahjong-rules-panel {
          background: rgba(22,34,20,.97);
          border: 3px solid var(--mahjong-gold);
          box-shadow: 6px 6px 0 rgba(0,0,0,.3);
          padding: 26px 34px;
          max-width: 480px;
          max-height: 84vh;
          overflow-y: auto;
          position: relative;
        }
      `}</style>
      <MahjongClient />
    </>
  );
}
