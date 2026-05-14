"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useReducer } from "react";
import { useThemeMode, type ThemeMode } from "@/app/lib/use-theme-mode";
import { useSiteLanguage } from "@/app/components/language-provider";
import { LeaderboardPanel } from "@/app/fun/leaderboard-panel";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BASE_SPEED = 720;
const SPEED_STEP = 60;
const MIN_SPEED = 130;

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
type BoardCell = PieceType | null;
type GameStatus = "playing" | "paused" | "over";

type Piece = {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
};

type GameState = {
  board: BoardCell[];
  piece: Piece;
  nextType: PieceType;
  score: number;
  lines: number;
  level: number;
  status: GameStatus;
};

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

const COLORS: Record<PieceType, string> = {
  I: "#6dd3ff",
  O: "#ffd56a",
  T: "#b98cff",
  S: "#6ff0a6",
  Z: "#ff7e7e",
  J: "#7aa7ff",
  L: "#ffb35c",
};

const SHAPE_BASES: Record<PieceType, number[][]> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  T: [[0, 1, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  S: [[0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  Z: [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  L: [[0, 0, 1, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
};

const ROTATIONS: Record<PieceType, number[][][]> = Object.fromEntries(
  PIECE_TYPES.map((type) => {
    const base = SHAPE_BASES[type];
    const rot1 = rotateMatrix(base);
    const rot2 = rotateMatrix(rot1);
    const rot3 = rotateMatrix(rot2);
    return [type, [base, rot1, rot2, rot3]];
  }),
) as Record<PieceType, number[][][]>;

const SCORE_TABLE: Record<number, number> = { 1: 100, 2: 300, 3: 500, 4: 800 };

function rotateMatrix(matrix: number[][]) {
  return Array.from({ length: 4 }, (_, x) => Array.from({ length: 4 }, (_, y) => matrix[3 - y][x]));
}

function createBoard() {
  return Array.from({ length: BOARD_WIDTH * BOARD_HEIGHT }, () => null as BoardCell);
}

function randomPieceType() {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

function createPiece(type: PieceType): Piece {
  return { type, rotation: 0, x: 3, y: 0 };
}

function getBlocks(piece: Piece) {
  const matrix = ROTATIONS[piece.type][piece.rotation % 4];
  const blocks: Array<{ x: number; y: number }> = [];

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      if (matrix[row][col]) {
        blocks.push({ x: piece.x + col, y: piece.y + row });
      }
    }
  }

  return blocks;
}

function canPlace(board: BoardCell[], piece: Piece) {
  return getBlocks(piece).every(({ x, y }) => {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
      return false;
    }

    return board[y * BOARD_WIDTH + x] === null;
  });
}

function mergePiece(board: BoardCell[], piece: Piece) {
  const nextBoard = board.slice();
  getBlocks(piece).forEach(({ x, y }) => {
    if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
      nextBoard[y * BOARD_WIDTH + x] = piece.type;
    }
  });
  return nextBoard;
}

function clearLines(board: BoardCell[]) {
  const rows: BoardCell[][] = [];
  let cleared = 0;

  for (let row = 0; row < BOARD_HEIGHT; row += 1) {
    const slice = board.slice(row * BOARD_WIDTH, row * BOARD_WIDTH + BOARD_WIDTH);
    if (slice.every(Boolean)) {
      cleared += 1;
    } else {
      rows.push(slice);
    }
  }

  while (rows.length < BOARD_HEIGHT) {
    rows.unshift(Array.from({ length: BOARD_WIDTH }, () => null));
  }

  return { board: rows.flat(), cleared };
}

function spawnNextPiece(state: GameState, lockedPiece: Piece): GameState {
  const merged = mergePiece(state.board, lockedPiece);
  const clearedResult = clearLines(merged);
  const cleared = clearedResult.cleared;
  const scoreGain = SCORE_TABLE[cleared] ?? cleared * 200;
  const lines = state.lines + cleared;
  const level = Math.floor(lines / 10) + 1;
  const nextPiece = createPiece(state.nextType);
  const nextType = randomPieceType();

  if (!canPlace(clearedResult.board, nextPiece)) {
    return {
      ...state,
      board: clearedResult.board,
      piece: nextPiece,
      nextType,
      score: state.score + scoreGain,
      lines,
      level,
      status: "over",
    };
  }

  return {
    ...state,
    board: clearedResult.board,
    piece: nextPiece,
    nextType,
    score: state.score + scoreGain,
    lines,
    level,
  };
}

function createInitialState(): GameState {
  const piece = createPiece(randomPieceType());
  const nextType = randomPieceType();
  const initialBoard = createBoard();

  return {
    board: initialBoard,
    piece,
    nextType,
    score: 0,
    lines: 0,
    level: 1,
    status: canPlace(initialBoard, piece) ? "playing" : "over",
  };
}

function hardDropPiece(state: GameState) {
  let nextPiece = { ...state.piece };

  while (canPlace(state.board, { ...nextPiece, y: nextPiece.y + 1 })) {
    nextPiece = { ...nextPiece, y: nextPiece.y + 1 };
  }

  return spawnNextPiece(state, nextPiece);
}

type Action =
  | { type: "RESET" }
  | { type: "TICK" }
  | { type: "MOVE"; dx: number; dy: number }
  | { type: "ROTATE" }
  | { type: "DROP" }
  | { type: "TOGGLE_PAUSE" };

function tryMove(state: GameState, dx: number, dy: number) {
  const movedPiece = { ...state.piece, x: state.piece.x + dx, y: state.piece.y + dy };
  if (canPlace(state.board, movedPiece)) {
    return {
      ...state,
      piece: movedPiece,
      score: dy === 1 ? state.score + 1 : state.score,
    };
  }

  if (dy === 1) {
    return spawnNextPiece(state, state.piece);
  }

  return state;
}

function tryRotate(state: GameState) {
  const nextRotation = (state.piece.rotation + 1) % 4;
  const kicks = [0, -1, 1, -2, 2];

  for (const kick of kicks) {
    const rotated = { ...state.piece, rotation: nextRotation, x: state.piece.x + kick };
    if (canPlace(state.board, rotated)) {
      return {
        ...state,
        piece: rotated,
      };
    }
  }

  return state;
}

function reducer(state: GameState, action: Action): GameState {
  if (action.type === "RESET") {
    return createInitialState();
  }

  if (state.status === "over") {
    return state;
  }

  if (action.type === "TOGGLE_PAUSE") {
    return {
      ...state,
      status: state.status === "paused" ? "playing" : "paused",
    };
  }

  if (state.status === "paused") {
    return state;
  }

  switch (action.type) {
    case "TICK":
      return tryMove(state, 0, 1);
    case "MOVE":
      return tryMove(state, action.dx, action.dy);
    case "ROTATE":
      return tryRotate(state);
    case "DROP":
      return hardDropPiece(state);
    default:
      return state;
  }
}

function previewMatrix(type: PieceType) {
  return ROTATIONS[type][0];
}

function renderPreviewCells(type: PieceType) {
  const matrix = previewMatrix(type);
  const cells: Array<{ filled: boolean; key: string }> = [];

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      cells.push({ filled: Boolean(matrix[row][col]), key: `${row}-${col}` });
    }
  }

  return cells;
}

function getPageClass(theme: ThemeMode) {
  return theme === "light"
    ? "bg-[radial-gradient(circle_at_top_right,rgba(24,21,19,0.07),transparent_28%),linear-gradient(180deg,#f5f1e8_0%,#efe8db_55%,#f5f1e8_100%)]"
    : "bg-[radial-gradient(circle_at_top_right,rgba(120,160,255,0.14),transparent_28%),linear-gradient(180deg,#050505_0%,#090909_55%,#050505_100%)]";
}

function surface(theme: ThemeMode, alpha = 0.72) {
  return theme === "light" ? `rgba(255,255,255,${alpha})` : `rgba(255,255,255,0.03)`;
}

function boardBack(theme: ThemeMode): CSSProperties {
  return { backgroundColor: theme === "light" ? "#e6dfd4" : "#161616" };
}

function boardInner(theme: ThemeMode): CSSProperties {
  return { backgroundColor: theme === "light" ? "#d7cec1" : "#232323" };
}

function cellBack(theme: ThemeMode, type: PieceType | null): CSSProperties {
  if (!type) {
    return { backgroundColor: theme === "light" ? "rgba(24,21,19,0.05)" : "rgba(255,255,255,0.04)" };
  }

  return {
    backgroundColor: COLORS[type],
    boxShadow: theme === "light" ? "inset 0 1px 0 rgba(255,255,255,0.4)" : "inset 0 1px 0 rgba(255,255,255,0.16)",
  };
}

export default function TetrisPage() {
  const theme = useThemeMode();
  const { language } = useSiteLanguage();

  const copy = {
    zh: {
      back: "返回 Fun",
      title: "俄罗斯方块",
      intro: "方向键移动，空格硬降，P 暂停，R 重开。",
      keys: ["方向键", "Space 硬降", "P 暂停", "R 重开"],
      score: "分数",
      lines: "行数",
      level: "等级",
      controls: "Controls",
      move: "移动",
      soft: "软降",
      rotate: "旋转",
      hard: "硬降",
      pause: "暂停",
      restart: "重开",
      playfield: "Playfield",
      boardTitle: "Stack with intent",
      paused: "已暂停",
      over: "游戏结束",
      next: "下一个",
      speed: "速度",
      goal: "目标是消行并继续往上爬。",
      tipOk: "把每一列保持干净，先清线，再追更高等级。",
      tipOver: "游戏结束了，重新开始再来一局。",
      backToFun: "返回 Fun",
    },
    en: {
      back: "Back to Fun",
      title: "Tetris",
      intro: "Arrow keys move, Space hard-drops, P pauses, R restarts.",
      keys: ["Arrow keys", "Space drop", "P pause", "R restart"],
      score: "Score",
      lines: "Lines",
      level: "Level",
      controls: "Controls",
      move: "Move",
      soft: "Soft drop",
      rotate: "Rotate",
      hard: "Hard drop",
      pause: "Pause",
      restart: "Restart",
      playfield: "Playfield",
      boardTitle: "Stack with intent",
      paused: "Paused",
      over: "Game over",
      next: "Next",
      speed: "Speed",
      goal: "Clear lines and keep climbing.",
      tipOk: "Keep each column tidy, clear lines first, then push for a higher level.",
      tipOver: "Game over. Start again for another run.",
      backToFun: "Back to Fun",
    },
  }[language];

  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    if (state.status !== "playing") {
      return undefined;
    }

    const speed = Math.max(MIN_SPEED, BASE_SPEED - (state.level - 1) * SPEED_STEP);
    const timer = window.setInterval(() => dispatch({ type: "TICK" }), speed);
    return () => window.clearInterval(timer);
  }, [state.level, state.status]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowdown", "arrowup", " ", "a", "d", "s", "w", "x", "p", "r"].includes(key)) {
        event.preventDefault();
      }

      if (key === "arrowleft" || key === "a") {
        dispatch({ type: "MOVE", dx: -1, dy: 0 });
      } else if (key === "arrowright" || key === "d") {
        dispatch({ type: "MOVE", dx: 1, dy: 0 });
      } else if (key === "arrowdown" || key === "s") {
        dispatch({ type: "MOVE", dx: 0, dy: 1 });
      } else if (key === "arrowup" || key === "w" || key === "x") {
        dispatch({ type: "ROTATE" });
      } else if (key === " ") {
        dispatch({ type: "DROP" });
      } else if (key === "p") {
        dispatch({ type: "TOGGLE_PAUSE" });
      } else if (key === "r") {
        dispatch({ type: "RESET" });
      }
    }

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayBoard = state.board.slice();
  getBlocks(state.piece).forEach(({ x, y }) => {
    if (x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT) {
      displayBoard[y * BOARD_WIDTH + x] = state.piece.type;
    }
  });

  const pageClass = getPageClass(theme);
  const panelSurface = surface(theme, 0.72);

  return (
    <div className={`min-h-screen pt-20 text-[var(--app-fg)] transition-colors duration-300 ${pageClass}`}>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="max-w-xl">
          <Link href="/fun" className="inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]">
            {copy.back}
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[var(--app-muted)]">Tetris</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">{copy.title}</h1>
          <p className="mt-6 text-sm leading-7 text-[var(--app-muted)] md:text-base">{copy.intro}</p>

          <div className="mt-8 flex flex-wrap gap-3 text-xs text-[var(--app-muted)]">
            {copy.keys.map((item) => (
              <span key={item} className="rounded-full border border-[var(--app-border)] px-3 py-2">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label={copy.score} value={state.score} surface={panelSurface} />
            <Stat label={copy.lines} value={state.lines} surface={panelSurface} />
            <Stat label={copy.level} value={state.level} surface={panelSurface} />
          </div>

          <div className="mt-8 rounded-[28px] border border-[var(--app-border)] p-5" style={{ backgroundColor: panelSurface }}>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-muted)]">{copy.controls}</p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--app-muted)] sm:grid-cols-2">
              <Control label={copy.move} value="Arrow keys / A D" />
              <Control label={copy.soft} value="Arrow Down / S" />
              <Control label={copy.rotate} value="Arrow Up / W / X" />
              <Control label={copy.hard} value="Space" />
              <Control label={copy.pause} value="P" />
              <Control label={copy.restart} value="R" />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ControlButton label="Left" onClick={() => dispatch({ type: "MOVE", dx: -1, dy: 0 })} />
            <ControlButton label="Right" onClick={() => dispatch({ type: "MOVE", dx: 1, dy: 0 })} />
            <ControlButton label="Rotate" onClick={() => dispatch({ type: "ROTATE" })} />
            <ControlButton label="Drop" onClick={() => dispatch({ type: "DROP" })} />
            <ControlButton label={state.status === "paused" ? "Resume" : copy.pause} onClick={() => dispatch({ type: "TOGGLE_PAUSE" })} />
            <button type="button" onClick={() => dispatch({ type: "RESET" })} className="rounded-full bg-[var(--app-fg)] px-4 py-2 text-sm font-medium text-[var(--app-bg)] transition-colors hover:opacity-90">
              {copy.restart}
            </button>
          </div>

          <p className="mt-6 text-sm text-[var(--app-muted)]">
            {state.status === "over" ? copy.tipOver : copy.tipOk}
          </p>
          <LeaderboardPanel gameKey="tetris" score={state.score} gameOver={state.status === "over"} />
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(circle,rgba(120,160,255,0.12),transparent_60%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-[var(--app-border)] p-4 md:p-6" style={{ backgroundColor: panelSurface, boxShadow: "0 30px 80px rgba(0,0,0,0.18)" }}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-muted)]">{copy.playfield}</p>
                <h2 className="mt-2 text-lg font-semibold">{copy.boardTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">
                {state.status === "paused" ? <Badge>{copy.paused}</Badge> : null}
                {state.status === "over" ? <Badge>{copy.over}</Badge> : null}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_140px]">
              <div className="rounded-[28px] p-3 md:p-4" style={boardBack(theme)}>
                <div className="grid aspect-[1/2] grid-cols-10 gap-[2px] rounded-[22px] p-2" style={boardInner(theme)}>
                  {displayBoard.map((cell, index) => (
                    <div key={index} className="rounded-[4px] border border-white/5 transition-colors" style={cellBack(theme, cell)} />
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--app-border)] p-4" style={{ backgroundColor: surface(theme, 0.55) }}>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-muted)]">{copy.next}</p>
                <div className="mt-4 rounded-[20px] p-3" style={boardBack(theme)}>
                  <div className="grid grid-cols-4 gap-2" style={boardInner(theme)}>
                    {renderPreviewCells(state.nextType).map((cell) => (
                      <div
                        key={cell.key}
                        className="aspect-square rounded-[4px] border border-white/5"
                        style={cell.filled ? cellBack(theme, state.nextType) : cellBack(theme, null)}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-5 space-y-3 text-sm text-[var(--app-muted)]">
                  <p>{copy.speed}: {Math.max(MIN_SPEED, BASE_SPEED - (state.level - 1) * SPEED_STEP)} ms</p>
                  <p>{copy.goal}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, surface }: { label: string; value: number; surface: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--app-border)] p-4" style={{ backgroundColor: surface }}>
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value.toLocaleString("en-US")}</p>
    </div>
  );
}

function Control({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">{label}</p>
      <p className="mt-2">{value}</p>
    </div>
  );
}

function ControlButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-fg)]/80 transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]">
      {label}
    </button>
  );
}

function Badge({ children }: { children: string }) {
  return <span className="rounded-full border border-[var(--app-border)] px-3 py-2">{children}</span>;
}
