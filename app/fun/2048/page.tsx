"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { useThemeMode, type ThemeMode } from "@/app/lib/use-theme-mode";
import { useSiteLanguage } from "@/app/components/language-provider";

const SIZE = 4;
const TARGET = 2048;
const BEST_KEY = "moonsilver-2048-best";

type Direction = "left" | "right" | "up" | "down";
type Board = number[];

function createEmptyBoard() {
  return Array.from({ length: SIZE * SIZE }, () => 0);
}

function cloneBoard(board: Board) {
  return board.slice();
}

function boardToMatrix(board: Board) {
  return Array.from({ length: SIZE }, (_, row) => board.slice(row * SIZE, row * SIZE + SIZE));
}

function matrixToBoard(matrix: number[][]) {
  return matrix.flat();
}

function reverseRows(matrix: number[][]) {
  return matrix.map((row) => row.slice().reverse());
}

function transpose(matrix: number[][]) {
  return Array.from({ length: SIZE }, (_, row) => Array.from({ length: SIZE }, (_, col) => matrix[col][row]));
}

function slideRow(row: number[]) {
  const values = row.filter(Boolean);
  const merged: number[] = [];
  let scoreGain = 0;

  for (let i = 0; i < values.length; i += 1) {
    const current = values[i];
    const next = values[i + 1];

    if (current === next) {
      const doubled = current * 2;
      merged.push(doubled);
      scoreGain += doubled;
      i += 1;
    } else {
      merged.push(current);
    }
  }

  while (merged.length < SIZE) {
    merged.push(0);
  }

  return {
    row: merged,
    moved: merged.some((value, index) => value !== row[index]),
    scoreGain,
  };
}

function moveBoard(board: Board, direction: Direction) {
  const matrix = boardToMatrix(board);

  let oriented = matrix;
  if (direction === "right") {
    oriented = reverseRows(matrix);
  } else if (direction === "up") {
    oriented = transpose(matrix);
  } else if (direction === "down") {
    oriented = reverseRows(transpose(matrix));
  }

  let moved = false;
  let scoreGain = 0;
  const nextOriented = oriented.map((row) => {
    const result = slideRow(row);
    moved ||= result.moved;
    scoreGain += result.scoreGain;
    return result.row;
  });

  let restored = nextOriented;
  if (direction === "right") {
    restored = reverseRows(nextOriented);
  } else if (direction === "up") {
    restored = transpose(nextOriented);
  } else if (direction === "down") {
    restored = transpose(reverseRows(nextOriented));
  }

  return {
    board: matrixToBoard(restored),
    moved,
    scoreGain,
  };
}

function getEmptyIndexes(board: Board) {
  return board.flatMap((value, index) => (value === 0 ? [index] : []));
}

function spawnTile(board: Board) {
  const empties = getEmptyIndexes(board);
  if (empties.length === 0) {
    return board;
  }

  const nextBoard = cloneBoard(board);
  const index = empties[Math.floor(Math.random() * empties.length)];
  nextBoard[index] = Math.random() < 0.9 ? 2 : 4;
  return nextBoard;
}

function hasMoves(board: Board) {
  if (board.some((value) => value === 0)) {
    return true;
  }

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const value = board[row * SIZE + col];
      const right = col < SIZE - 1 ? board[row * SIZE + col + 1] : 0;
      const down = row < SIZE - 1 ? board[(row + 1) * SIZE + col] : 0;
      if (value === right || value === down) {
        return true;
      }
    }
  }

  return false;
}

function formatScore(value: number) {
  return value.toLocaleString("en-US");
}

function readBestScore() {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = window.localStorage.getItem(BEST_KEY);
  if (!stored) {
    return 0;
  }

  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPageClass(theme: ThemeMode) {
  return theme === "light"
    ? "bg-[radial-gradient(circle_at_top_left,rgba(24,21,19,0.07),transparent_30%),linear-gradient(180deg,#f5f1e8_0%,#efe8db_55%,#f5f1e8_100%)]"
    : "bg-[radial-gradient(circle_at_top_left,rgba(255,200,120,0.14),transparent_30%),linear-gradient(180deg,#050505_0%,#090909_55%,#050505_100%)]";
}

function getSurface(theme: ThemeMode, alpha = 0.72) {
  return theme === "light" ? `rgba(255,255,255,${alpha})` : `rgba(255,255,255,${Math.min(alpha, 0.08)})`;
}

function getBoardStyle(theme: ThemeMode): CSSProperties {
  return {
    backgroundColor: theme === "light" ? "#e7dfd1" : "#171411",
  };
}

function getInnerBoardStyle(theme: ThemeMode): CSSProperties {
  return {
    backgroundColor: theme === "light" ? "#d8cfc0" : "#2a2420",
  };
}

function getTileStyle(value: number, theme: ThemeMode): CSSProperties {
  const darkPalette: Record<number, string> = {
    0: "rgba(255,255,255,0.04)",
    2: "#f0eadf",
    4: "#e7ddcd",
    8: "#d9c49f",
    16: "#d0a66e",
    32: "#d78b53",
    64: "#e26a42",
    128: "#e4c35a",
    256: "#e7d45d",
    512: "#f0dd74",
    1024: "#f7e4a1",
    2048: "#fff7d6",
  };

  const lightPalette: Record<number, string> = {
    0: "rgba(24,21,19,0.05)",
    2: "#efe7da",
    4: "#e5dbc9",
    8: "#d8c29a",
    16: "#cc9d64",
    32: "#d7894a",
    64: "#e06a3f",
    128: "#dec14e",
    256: "#e2cf52",
    512: "#ebda6e",
    1024: "#f3e19c",
    2048: "#fff7d6",
  };

  const palette = theme === "light" ? lightPalette : darkPalette;
  const backgroundColor = palette[value] ?? palette[2048];
  const color = value >= 128 ? "#1a1200" : "#20170d";

  return {
    backgroundColor,
    color,
    boxShadow: theme === "light" ? "inset 0 1px 0 rgba(255,255,255,0.35)" : "inset 0 1px 0 rgba(255,255,255,0.14)",
  };
}

export default function Game2048Page() {
  const theme = useThemeMode();
  const { language } = useSiteLanguage();
  const copy = {
    zh: {
      back: "返回 Fun",
      title: "滑动合并，往一个角落堆数字",
      intro: "方向键和 WASD 都可以操作。",
      keys: ["方向键", "WASD", "R 重开"],
      score: "分数",
      best: "最高分",
      goal: "目标",
      board: "棋盘",
      boardTitle: "Keep the grid breathing",
      won: "2048 达成",
      gameOver: "没有可用操作",
      tipLabel: "提示",
      tip: "2048 到了以后可以继续玩，尽量把大数字堆到一个角落。",
      moveLeft: "左移",
      moveUp: "上移",
      moveDown: "下移",
      moveRight: "右移",
      restart: "重新开始",
      combine: "合并相同数字",
    },
    en: {
      back: "Back to Fun",
      title: "Slide and merge tiles toward one corner.",
      intro: "Arrow keys and WASD both work.",
      keys: ["Arrow keys", "WASD", "R restart"],
      score: "Score",
      best: "Best",
      goal: "Goal",
      board: "Board",
      boardTitle: "Keep the grid breathing",
      won: "2048 reached",
      gameOver: "No moves left",
      tipLabel: "Tip",
      tip: "Once you reach 2048, keep going and try to park the larger numbers in one corner.",
      moveLeft: "Left",
      moveUp: "Up",
      moveDown: "Down",
      moveRight: "Right",
      restart: "Restart",
      combine: "Combine equal tiles",
    },
  }[language];

  const [board, setBoard] = useState<Board>(() => spawnTile(spawnTile(createEmptyBoard())));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => readBestScore());

  const won = board.some((value) => value >= TARGET);
  const gameOver = !hasMoves(board);

  useEffect(() => {
    window.localStorage.setItem(BEST_KEY, String(bestScore));
  }, [bestScore]);

  const resetGame = useCallback(() => {
    setBoard(spawnTile(spawnTile(createEmptyBoard())));
    setScore(0);
  }, []);

  const applyMove = useCallback(
    (direction: Direction) => {
      if (gameOver) {
        return;
      }

      const result = moveBoard(board, direction);
      if (!result.moved) {
        return;
      }

      const nextBoard = spawnTile(result.board);
      const nextScore = score + result.scoreGain;

      setBoard(nextBoard);
      setScore(nextScore);
      setBestScore((current) => Math.max(current, nextScore));
    },
    [board, gameOver, score],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
      }

      if (key === "arrowleft" || key === "a") {
        applyMove("left");
      } else if (key === "arrowright" || key === "d") {
        applyMove("right");
      } else if (key === "arrowup" || key === "w") {
        applyMove("up");
      } else if (key === "arrowdown" || key === "s") {
        applyMove("down");
      } else if (key === "r") {
        resetGame();
      }
    }

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [applyMove, resetGame]);

  const pageClass = getPageClass(theme);
  const surface = getSurface(theme, 0.72);
  const surfaceSoft = getSurface(theme, 0.56);

  return (
    <div className={`min-h-screen pt-20 text-[var(--app-fg)] transition-colors duration-300 ${pageClass}`}>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="max-w-xl">
          <Link href="/fun" className="inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]">
            {copy.back}
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[var(--app-muted)]">2048</p>
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
            <Stat label={copy.score} value={score} surface={surface} />
            <Stat label={copy.best} value={bestScore} surface={surface} />
            <Stat label={copy.goal} value={2048} surface={surface} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ControlButton label={copy.moveLeft} onClick={() => applyMove("left")} />
            <ControlButton label={copy.moveUp} onClick={() => applyMove("up")} />
            <ControlButton label={copy.moveDown} onClick={() => applyMove("down")} />
            <ControlButton label={copy.moveRight} onClick={() => applyMove("right")} />
            <button type="button" onClick={resetGame} className="rounded-full bg-[var(--app-fg)] px-4 py-2 text-sm font-medium text-[var(--app-bg)] transition-colors hover:opacity-90">
              {copy.restart}
            </button>
          </div>

          <p className="mt-6 text-sm text-[var(--app-muted)]">{copy.tipLabel}: {copy.tip}</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(circle,rgba(255,165,0,0.12),transparent_60%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-[var(--app-border)] p-4 md:p-6" style={{ backgroundColor: surfaceSoft, boxShadow: "0 30px 80px rgba(0,0,0,0.22)" }}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-muted)]">{copy.board}</p>
                <h2 className="mt-2 text-lg font-semibold">{copy.boardTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--app-muted)]">
                {won ? <Badge>{copy.won}</Badge> : null}
                {gameOver ? <Badge>{copy.gameOver}</Badge> : null}
              </div>
            </div>

            <div className="rounded-[28px] p-3 md:p-4" style={getBoardStyle(theme)}>
              <div className="grid grid-cols-4 gap-3 rounded-[22px] p-3 md:p-4" style={getInnerBoardStyle(theme)}>
                {board.map((value, index) => (
                  <div
                    key={`${index}-${value}`}
                    className="flex aspect-square items-center justify-center rounded-[18px] text-3xl font-semibold transition-all duration-200 md:text-4xl"
                    style={getTileStyle(value, theme)}
                  >
                    {value === 0 ? "" : value}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--app-muted)]">
              <span>{copy.tipLabel}</span>
              <span>{copy.combine}</span>
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
      <p className="mt-2 text-3xl font-semibold">{formatScore(value)}</p>
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
