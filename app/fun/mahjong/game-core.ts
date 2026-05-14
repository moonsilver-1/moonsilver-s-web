/* ═══════════════════════════════════════════════════
   湖州麻将 · 游戏核心逻辑
   ═══════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────

export type Suit = "w" | "t" | "b" | "h";
export type HonorId = "E" | "S" | "W" | "N" | "Z" | "F" | "P";

export interface Tile {
  suit: Suit;
  n: number;
  id: string; // "w3", "E", "P", etc.
}

export type MeldType = "peng" | "chi" | "gang_open" | "gang_hidden";

export interface Meld {
  type: MeldType;
  tiles: Tile[];
}

export interface Player {
  name: string;
  score: number;
  isHuman: boolean;
}

export interface GameConfig {
  name: string;
  score: number;
  base: number;
  punish: string;
  pthr: number;
}

export interface FanResult {
  total: number;
  desc: string;
}

export interface GameState {
  deck: Tile[];
  di: number;
  hands: Tile[][];
  melds: Meld[][];
  discs: Tile[][];
  phase: "idle" | "prediscard" | "discard" | "react";
  cur: number;
  lastD: Tile | null;
  lastDpid: number;
  round: number;
  dealer: number;
}

// ── Constants ──────────────────────────────────────

export const HONOR_NAMES: Record<string, string> = {
  E: "東", S: "南", W: "西", N: "北", Z: "中", F: "發", P: "白",
};

const WAN_NAMES = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const JOKER_KEY = "P";

// ── Tile Helpers ───────────────────────────────────

export function tileName(t: Tile): string {
  const sn: Record<string, string> = { w: "万", t: "条", b: "筒" };
  return t.suit === "h" ? HONOR_NAMES[t.id] : t.n + sn[t.suit];
}

export function tileOrder(t: Tile): number {
  if (t.id === "P") return 9999;
  if (t.suit === "h") {
    const o: Record<string, number> = { E: 0, S: 1, W: 2, N: 3, Z: 4, F: 5 };
    return 3000 + (o[t.id] ?? 6);
  }
  const s: Record<string, number> = { w: 0, b: 100, t: 200 };
  return s[t.suit] + t.n;
}

export function sortHand(h: Tile[]): void {
  h.sort((a, b) => tileOrder(a) - tileOrder(b));
}

// ── Deck ───────────────────────────────────────────

export function makeDeck(): Tile[] {
  const d: Tile[] = [];
  for (const s of ["w", "t", "b"] as Suit[])
    for (let n = 1; n <= 9; n++)
      for (let c = 0; c < 4; c++)
        d.push({ suit: s, n, id: `${s}${n}` });
  for (const h of ["E", "S", "W", "N", "Z", "F", "P"] as HonorId[])
    for (let c = 0; c < 4; c++)
      d.push({ suit: "h", n: 0, id: h });
  return d;
}

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Win Detection ──────────────────────────────────

function tileToKey(t: Tile): string {
  if (t.suit === "h") return t.id;
  return t.suit.toUpperCase() + t.n;
}

function is7P(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;
  const c: Record<string, number> = {};
  for (const t of hand) c[t.id] = (c[t.id] || 0) + 1;
  const jokers = c["P"] || 0;
  let pairs = 0;
  let singles = 0;
  for (const [id, v] of Object.entries(c)) {
    if (id === "P") continue;
    pairs += Math.floor(v / 2);
    singles += v % 2;
  }
  const used = Math.min(jokers, singles);
  singles -= used;
  pairs += used + Math.floor((jokers - used) / 2);
  return pairs >= 7 && singles === 0;
}

function canFormSets(count: Record<string, number>, jokers: number): boolean {
  const tile = Object.keys(count).find((k) => count[k] > 0);
  if (!tile) return jokers % 3 === 0;

  // Triplet
  if (count[tile] >= 3) {
    count[tile] -= 3;
    if (canFormSets(count, jokers)) return true;
    count[tile] += 3;
  }
  // Triplet + 1 joker
  if (count[tile] === 2 && jokers >= 1) {
    count[tile] -= 2;
    if (canFormSets(count, jokers - 1)) return true;
    count[tile] += 2;
  }
  // Triplet + 2 jokers
  if (count[tile] === 1 && jokers >= 2) {
    count[tile] -= 1;
    if (canFormSets(count, jokers - 2)) return true;
    count[tile] += 1;
  }

  // Sequence (suit tile)
  const suit = tile[0];
  const num = parseInt(tile[1]);
  if (["W", "T", "B"].includes(suit) && !isNaN(num) && num <= 7) {
    const t2 = suit + (num + 1);
    const t3 = suit + (num + 2);
    let need = 0;
    if (!count[t2]) need++;
    if (!count[t3]) need++;
    if (jokers >= need) {
      count[tile]--;
      if (count[t2]) count[t2]--;
      if (count[t3]) count[t3]--;
      if (canFormSets(count, jokers - need)) return true;
      count[tile]++;
      if (count[t2] !== undefined) count[t2]++;
      if (count[t3] !== undefined) count[t3]++;
    }
  }
  // Sequence with joker filling head
  if (["W", "T", "B"].includes(suit) && !isNaN(num)) {
    if (num <= 8 && jokers >= 1) {
      const t2 = suit + (num + 1);
      if (count[t2] > 0) {
        count[tile]--;
        count[t2]--;
        if (canFormSets(count, jokers - 1)) return true;
        count[tile]++;
        count[t2]++;
      }
    }
  }
  return false;
}

function canHuStable(hand: string[], joker: string): boolean {
  if (hand.length % 3 !== 2) return false;
  let jCount = 0;
  const tiles: string[] = [];
  for (const t of hand) {
    if (t === joker) jCount++;
    else tiles.push(t);
  }
  const count: Record<string, number> = {};
  tiles.forEach((t) => (count[t] = (count[t] || 0) + 1));
  const keys = Object.keys(count);

  for (const tile of keys) {
    if (count[tile] >= 2) {
      count[tile] -= 2;
      if (canFormSets(count, jCount)) return true;
      count[tile] += 2;
    }
    if (count[tile] >= 1 && jCount >= 1) {
      count[tile] -= 1;
      if (canFormSets(count, jCount - 1)) return true;
      count[tile] += 1;
    }
  }
  if (jCount >= 2) {
    if (canFormSets(count, jCount - 2)) return true;
  }
  return false;
}

export function isWin(hand: Tile[], melds: Meld[]): boolean {
  if (!hand || hand.length === 0) return false;
  if (melds.length === 0 && hand.length === 14 && is7P(hand)) return true;
  const expected = 14 - melds.length * 3;
  if (hand.length !== expected) return false;
  const strHand = hand.map(tileToKey);
  return canHuStable(strHand, JOKER_KEY);
}

// ── Fan Calculation ────────────────────────────────

function isQYS(h: Tile[], m: Meld[]): boolean {
  const all = [...h, ...m.flatMap((x) => x.tiles)];
  const nonHonorSuits = new Set(all.filter((t) => t.suit !== "h").map((t) => t.suit));
  return nonHonorSuits.size === 1 && !all.some((t) => t.suit === "h" && t.id !== "P");
}

function isHYS(h: Tile[], m: Meld[]): boolean {
  const all = [...h, ...m.flatMap((x) => x.tiles)];
  const nonHonorSuits = new Set(all.filter((t) => t.suit !== "h").map((t) => t.suit));
  return nonHonorSuits.size === 1 && all.some((t) => t.suit === "h" && t.id !== "P");
}

export function calcFan(hand: Tile[], melds: Meld[], isSelf: boolean): FanResult {
  let fan = 1;
  const parts: string[] = ["基础1"];

  if (isQYS(hand, melds)) {
    fan += 6;
    parts.push("清一色+6");
  } else if (isHYS(hand, melds)) {
    fan += 3;
    parts.push("混一色+3");
  }

  if (melds.length === 0 && is7P(hand)) {
    const hp: Record<string, number> = {};
    for (const t of hand.filter((t) => t.suit === "h")) hp[t.id] = (hp[t.id] || 0) + 1;
    if (Object.values(hp).filter((v) => v >= 2).length >= 2) {
      fan += 8;
      parts.push("豪华七对+8");
    } else {
      fan += 4;
      parts.push("七对+4");
    }
  } else if (melds.every((m) => m.type === "peng" || m.type.startsWith("gang")) && melds.length >= 3) {
    fan += 4;
    parts.push("对对胡+4");
  }

  for (const m of melds) {
    if (m.type === "gang_hidden") {
      fan += 2;
      parts.push("暗杠+2");
    } else if (m.type === "gang_open") {
      fan += 1;
      parts.push("明杠+1");
    }
  }

  if (isSelf) {
    fan *= 2;
    parts.push("自摸×2");
  }

  return { total: fan, desc: parts.join(" · ") };
}

// ── Reaction Checks ────────────────────────────────

export function canPeng(hand: Tile[], tile: Tile): boolean {
  return hand.filter((x) => x.id === tile.id).length >= 2;
}

export function canGangDiscard(hand: Tile[], tile: Tile): boolean {
  return hand.filter((x) => x.id === tile.id).length >= 3;
}

export function huOnTile(hand: Tile[], melds: Meld[], tile: Tile): boolean {
  if (hand.some((x) => x.id === "P")) return false;
  const testHand = [...hand, tile];
  return isWin(testHand, melds);
}

export function selfDrawOk(hand: Tile[], melds: Meld[]): boolean {
  return isWin(hand, melds);
}

export function selfGangs(hand: Tile[], melds: Meld[]): Tile[] {
  const cnt: Record<string, number> = {};
  for (const t of hand) cnt[t.id] = (cnt[t.id] || 0) + 1;
  const res: Tile[] = [];
  for (const [id, c] of Object.entries(cnt)) {
    if (c === 4) res.push(hand.find((t) => t.id === id)!);
    if (c === 1 && melds.some((m) => m.type === "peng" && m.tiles[0].id === id))
      res.push(hand.find((t) => t.id === id)!);
  }
  return res;
}

export function canChi(hand: Tile[], tile: Tile, from: number, pid: number): Tile[][] {
  if ((from + 1) % 4 !== pid || tile.suit === "h") return [];
  const res: Tile[][] = [];
  for (let d = -2; d <= 0; d++) {
    const need = [tile.n + d, tile.n + d + 1, tile.n + d + 2].filter((n) => n !== tile.n);
    if (need.some((n) => n < 1 || n > 9)) continue;
    const u = [...hand];
    let ok = true;
    const seq: Tile[] = [];
    for (const n of need) {
      const i = u.findIndex((t) => t.suit === tile.suit && t.n === n);
      if (i < 0) { ok = false; break; }
      seq.push(u.splice(i, 1)[0]);
    }
    if (ok) {
      const f = [...seq, tile].sort((a, b) => a.n - b.n);
      const k = f.map((t) => t.n).join("");
      if (!res.find((r) => r.map((t) => t.n).join("") === k)) res.push(f);
    }
  }
  return res;
}

// ── AI ─────────────────────────────────────────────

export function aiPick(hand: Tile[]): number {
  let wi = 0;
  let ws = 999;
  for (let i = 0; i < hand.length; i++) {
    const s = tileValue(hand, i);
    if (s < ws) { ws = s; wi = i; }
  }
  return wi;
}

function tileValue(h: Tile[], i: number): number {
  const t = h[i];
  if (t.id === "P") return 4;
  let s = h.filter((x) => x.id === t.id).length * 4;
  if (t.suit !== "h") {
    for (let d = -2; d <= 2; d++) {
      if (d && h.some((x) => x.suit === t.suit && x.n === t.n + d)) s += 2;
    }
  }
  return s;
}

// ── Wan number names for rendering ─────────────────

export { WAN_NAMES };
