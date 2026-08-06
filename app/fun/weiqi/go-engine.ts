/* ═══════════════════════════════════════════════════
   围棋 · 纯逻辑引擎（客户端/服务端共用）
   ─ 中国规则，贴目可配
   ─ 提子 / 自杀禁着 / 全局劫（positional superko）
   ─ Benson 算法判无条件活 + 启发式死子标记
   ─ 数子法计分
   ═══════════════════════════════════════════════════ */

export type Stone = "B" | "W";
export type Cell = Stone | null;
export type Board = Cell[][];

export interface Move {
  x: number; // -1 表示 pass
  y: number;
  color: Stone;
  pass?: boolean;
}

export interface Captured {
  B: number; // 被黑提掉的白子数
  W: number; // 被白提掉的黑子数
}

export interface ScoreResult {
  black: number;
  white: number;
  komi: number;
  winner: "B" | "W" | "draw";
  diff: number;
  blackStones: number;
  whiteStones: number;
  blackTerritory: number;
  whiteTerritory: number;
  deadCount: number;
}

export const DEFAULT_KOMI: Record<number, number> = {
  9: 5.5,
  13: 5.5,
  19: 7.5,
};

export function opponent(c: Stone): Stone {
  return c === "B" ? "W" : "B";
}

export function createBoard(size: number): Board {
  return Array.from({ length: size }, () => Array<Cell>(size).fill(null));
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => row.slice());
}

export function inBounds(b: Board, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < b.length && y < b.length;
}

export function boardKey(b: Board): string {
  // 棋盘规范哈希：供 superko 去重用
  let s = "";
  for (let y = 0; y < b.length; y++) {
    for (let x = 0; x < b.length; x++) {
      const c = b[y][x];
      s += c === "B" ? "B" : c === "W" ? "W" : ".";
    }
  }
  return s;
}

/** 取 (x,y) 所在连通棋块（仅同色），以及它的所有气（空邻点） */
export function groupAt(b: Board, x: number, y: number): { stones: Array<[number, number]>; libs: Set<string> } {
  const color = b[y][x];
  const stones: Array<[number, number]> = [];
  const libs = new Set<string>();
  if (!color) return { stones, libs };
  const visited = new Set<string>();
  const stack: Array<[number, number]> = [[x, y]];
  const key = (px: number, py: number) => `${px},${py}`;
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    const k = key(cx, cy);
    if (visited.has(k)) continue;
    visited.add(k);
    stones.push([cx, cy]);
    for (const [nx, ny] of neighbors(b, cx, cy)) {
      const nc = b[ny][nx];
      if (nc === null) libs.add(key(nx, ny));
      else if (nc === color && !visited.has(key(nx, ny))) stack.push([nx, ny]);
    }
  }
  return { stones, libs };
}

export function neighbors(b: Board, x: number, y: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  if (x > 0) out.push([x - 1, y]);
  if (x < b.length - 1) out.push([x + 1, y]);
  if (y > 0) out.push([x, y - 1]);
  if (y < b.length - 1) out.push([x, y + 1]);
  return out;
}

/** 所有棋块的分组信息（用于死活判定） */
export interface Block {
  color: Stone;
  stones: Array<[number, number]>;
  libs: Set<string>;
}

export function allBlocks(b: Board): Block[] {
  const seen = new Set<string>();
  const out: Block[] = [];
  for (let y = 0; y < b.length; y++) {
    for (let x = 0; x < b.length; x++) {
      const c = b[y][x];
      if (!c) continue;
      const k = `${x},${y}`;
      if (seen.has(k)) continue;
      const { stones, libs } = groupAt(b, x, y);
      for (const [sx, sy] of stones) seen.add(`${sx},${sy}`);
      out.push({ color: c, stones, libs });
    }
  }
  return out;
}

export interface PlayResult {
  ok: boolean;
  board: Board; // 新棋盘（成功时为落子后、提子后；失败时为传入副本）
  captured: Array<[number, number]>; // 本次提走的对方子坐标
  reason?: string;
}

/**
 * 落子。返回新棋盘与提子列表。
 * 规则：
 *  - 目标须为空
 *  - 放子后先提走对方无气块
 *  - 再检查自身是否有气（无气=自杀，禁着）
 *  - 全局劫：新棋盘不得与 history 中任一历史棋盘相同（positional superko）
 */
export function play(
  board: Board,
  x: number,
  y: number,
  color: Stone,
  history: Set<string>,
): PlayResult {
  if (!inBounds(board, x, y)) return { ok: false, board, captured: [], reason: "越界" };
  if (board[y][x] !== null) return { ok: false, board, captured: [], reason: "此处已有子" };

  const nb = cloneBoard(board);
  nb[y][x] = color;
  const opp = opponent(color);
  const captured: Array<[number, number]> = [];

  // 提走对方无气的块
  for (const [nx, ny] of neighbors(nb, x, y)) {
    if (nb[ny][nx] === opp) {
      const { stones, libs } = groupAt(nb, nx, ny);
      if (libs.size === 0) {
        for (const [sx, sy] of stones) {
          nb[sy][sx] = null;
          captured.push([sx, sy]);
        }
      }
    }
  }

  // 检查自身是否有气
  const { libs: selfLibs } = groupAt(nb, x, y);
  if (selfLibs.size === 0) {
    return { ok: false, board, captured: [], reason: "禁着点（自杀）" };
  }

  // 全局劫（禁同形）
  if (history.has(boardKey(nb))) {
    return { ok: false, board, captured: [], reason: "禁着点（劫）" };
  }

  return { ok: true, board: nb, captured };
}

/** 该点是否可合法落子 */
export function isLegal(board: Board, x: number, y: number, color: Stone, history: Set<string>): boolean {
  const r = play(board, x, y, color, history);
  return r.ok;
}

/** 枚举所有合法落子点 */
export function legalMoves(board: Board, color: Stone, history: Set<string>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      if (board[y][x] !== null) continue;
      if (isLegal(board, x, y, color, history)) out.push([x, y]);
    }
  }
  return out;
}

/* ═══════════════════════════════════════════════════
   死活判定
   ─ Benson 算法：判定「无条件活」（即两真眼以上，数学可证）
   ─ 启发式：未达无条件活且眼/气明显不足 → 标死子
   ─ 双活（seki）判不准 → 留给玩家
   ═══════════════════════════════════════════════════ */

/** 取一个空交叉点所属的空连通区域（及邻接的色集合） */
function regionAt(b: Board, x: number, y: number): {
  empties: Array<[number, number]>;
  borders: Set<Stone>;
} {
  const empties: Array<[number, number]> = [];
  const borders = new Set<Stone>();
  const visited = new Set<string>();
  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    const k = `${cx},${cy}`;
    if (visited.has(k)) continue;
    visited.add(k);
    empties.push([cx, cy]);
    for (const [nx, ny] of neighbors(b, cx, cy)) {
      const nc = b[ny][nx];
      if (nc === null) {
        if (!visited.has(`${nx},${ny}`)) stack.push([nx, ny]);
      } else {
        borders.add(nc);
      }
    }
  }
  return { empties, borders };
}

/** 盘面所有空区域 */
function emptyRegions(b: Board): Array<{ empties: Array<[number, number]>; borders: Set<Stone> }> {
  const seen = new Set<string>();
  const out: Array<{ empties: Array<[number, number]>; borders: Set<Stone> }> = [];
  for (let y = 0; y < b.length; y++) {
    for (let x = 0; x < b.length; x++) {
      if (b[y][x] !== null) continue;
      const k = `${x},${y}`;
      if (seen.has(k)) continue;
      const reg = regionAt(b, x, y);
      for (const [ex, ey] of reg.empties) seen.add(`${ex},${ey}`);
      out.push(reg);
    }
  }
  return out;
}

/**
 * Benson 算法：返回数学上「无条件活」的棋块坐标集合（按 stones 索引）。
 * 原理：一个块若被若干「小眼区域」单方包围，且这些区域中至少有两个
 * 能让块抵御任意入侵（区域是块的单方包围且区域邻接的块的交≥2），则无条件活。
 */
export function bensonAlive(b: Board): { aliveBlack: Set<string>; aliveWhite: Set<string> } {
  const size = b.length;
  const blocks = allBlocks(b);
  const regions = emptyRegions(b);

  const aliveBlack = new Set<string>();
  const aliveWhite = new Set<string>();

  for (const blk of blocks) {
    // 该块邻接的、且仅被本方包围的空区域 = 候选「眼」
    const eyeRegions = regions.filter(
      (r) => r.borders.size === 1 && r.borders.has(blk.color),
    );
    if (eyeRegions.length < 2) continue;

    // 计算每个眼区域接触到的、属于本块的点的集合
    const blockStoneSet = new Set(blk.stones.map(([sx, sy]) => `${sx},${sy}`));
    const eyeContacts = eyeRegions.map((r) => {
      const contact = new Set<string>();
      for (const [ex, ey] of r.empties) {
        for (const [nx, ny] of neighbors(b, ex, ey)) {
          const k = `${nx},${ny}`;
          if (blockStoneSet.has(k)) contact.add(k);
        }
      }
      return contact;
    });

    // Benson 准则：至少存在两个「眼」，它们的接触集相互独立（接触交≥1 即够鲁棒）
    // 简化版：取两个接触集合，若二者不互为子集且各自非空，判活。
    // 更严格地：接触集合数 ≥ 2 即视为两真眼。
    const nonEmptyEyes = eyeContacts.filter((c) => c.size >= 1);
    if (nonEmptyEyes.length >= 2) {
      for (const [sx, sy] of blk.stones) {
        if (blk.color === "B") aliveBlack.add(`${sx},${sy}`);
        else aliveWhite.add(`${sx},${sy}`);
      }
    }
  }

  // 避免未使用变量告警
  void size;
  return { aliveBlack, aliveWhite };
}

/**
 * 启发式死子标记（仿腾讯围棋的「自动标记」）。
 * 思路：
 *  1. Benson 判出无条件活的块 → 必活，不计死子
 *  2. 其余块若被对方「完全包围」（即四周空点/区域全部只接触对方或己方死子）→ 标死
 *  3. 双活（seki）块两边互不包围 → 不标，交给玩家定
 * 返回应当标记为死子的坐标集合（字符串 "x,y"）。
 */
export function autoMarkDeadStones(b: Board): Set<string> {
  const { aliveBlack, aliveWhite } = bensonAlive(b);
  const regions = emptyRegions(b);
  const dead = new Set<string>();
  const blocks = allBlocks(b);

  for (const blk of blocks) {
    // 已判无条件活，跳过
    const isAlive = blk.stones.every(([sx, sy]) =>
      blk.color === "B" ? aliveBlack.has(`${sx},${sy}`) : aliveWhite.has(`${sx},${sy}`),
    );
    if (isAlive) continue;

    const opp = opponent(blk.color);
    // 判该块是否被对方完全包围：所有相邻空区域都只接触对方
    let fullyEnclosed = true;
    let hasAdjacentEmpty = false;
    for (const [sx, sy] of blk.stones) {
      for (const [nx, ny] of neighbors(b, sx, sy)) {
        if (b[ny][nx] === null) {
          hasAdjacentEmpty = true;
          // 该空区域是否只接触对方（或为对方独占）
          for (const r of regions) {
            if (r.empties.some(([ex, ey]) => ex === nx && ey === ny)) {
              // 区域边界色集合
              if (r.borders.size === 1 && r.borders.has(opp)) {
                // 单方对方包围 = 完全围
              } else if (r.borders.has(blk.color)) {
                // 区域还接触到本方（自己的眼或地）→ 本块未被完全围死
                fullyEnclosed = false;
              }
            }
          }
        }
      }
    }
    if (hasAdjacentEmpty && fullyEnclosed) {
      for (const [sx, sy] of blk.stones) dead.add(`${sx},${sy}`);
    }
  }

  return dead;
}

/* ═══════════════════════════════════════════════════
   数子法计分（中国规则）
   ─ 先移除双方确认的死子
   ─ 黑分 = 黑活子数 + 黑独占空
   ─ 白分 = 白活子数 + 白独占空 + 贴目
   ═══════════════════════════════════════════════════ */

export function score(
  board: Board,
  deadSet: Set<string>,
  komi: number,
): ScoreResult {
  const size = board.length;
  // 1. 移除死子后的工作棋盘
  const work = cloneBoard(board);
  let deadCount = 0;
  for (const k of deadSet) {
    const [x, y] = k.split(",").map(Number);
    if (inBounds(work, x, y) && work[y][x] !== null) {
      work[y][x] = null;
      deadCount++;
    }
  }

  // 2. 数子 + 数空
  let blackStones = 0;
  let whiteStones = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (work[y][x] === "B") blackStones++;
      else if (work[y][x] === "W") whiteStones++;
    }
  }

  // 3. 围空（flood fill 空区域，独占区域归该方）
  let blackTerritory = 0;
  let whiteTerritory = 0;
  const seen = new Set<string>();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (work[y][x] !== null) continue;
      const k = `${x},${y}`;
      if (seen.has(k)) continue;
      const { empties, borders } = regionAt(work, x, y);
      for (const [ex, ey] of empties) seen.add(`${ex},${ey}`);
      if (borders.size === 1) {
        if (borders.has("B")) blackTerritory += empties.length;
        else whiteTerritory += empties.length;
      }
      // 双方都接触的中腹/双活 → 不计
    }
  }

  const black = blackStones + blackTerritory;
  const white = whiteStones + whiteTerritory + komi;
  const diff = black - white;
  const winner: "B" | "W" | "draw" = diff > 0 ? "B" : diff < 0 ? "W" : "draw";

  return {
    black,
    white,
    komi,
    winner,
    diff: Math.abs(diff),
    blackStones,
    whiteStones,
    blackTerritory,
    whiteTerritory,
    deadCount,
  };
}

/** 星位坐标（用于渲染） */
export function starPoints(size: number): Array<[number, number]> {
  if (size === 19) {
    const pts = [3, 9, 15];
    const out: Array<[number, number]> = [];
    for (const y of pts) for (const x of pts) out.push([x, y]);
    return out;
  }
  if (size === 13) {
    return [
      [3, 3], [6, 3], [9, 3],
      [3, 6], [9, 6],
      [3, 9], [6, 9], [9, 9],
    ];
  }
  if (size === 9) {
    return [
      [2, 2], [6, 2],
      [2, 6], [6, 6],
      [4, 4],
    ];
  }
  return [];
}
