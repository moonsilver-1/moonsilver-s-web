"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/components/auth-provider";
import {
  type Tile,
  type Meld,
  type Player,
  type GameConfig,
  type FanResult,
  HONOR_NAMES,
  WAN_NAMES,
  makeDeck,
  shuffle,
  sortHand,
  tileName,
  calcFan,
  canPeng,
  canGangDiscard,
  huOnTile,
  selfDrawOk,
  selfGangs,
  canChi,
  aiPick,
  tileOrder,
} from "./game-core";

// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?//  AUDIO
// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
const audioCtxRef = { current: null as AudioContext | null };
let sfxOn = true;

function getAC() {
  if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioCtxRef.current;
}

function tone(f: number, t: OscillatorType = "square", d = 0.08, v = 0.13, delay = 0) {
  if (!sfxOn) return;
  try {
    const ac = getAC();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g);
    g.connect(ac.destination);
    o.type = t;
    o.frequency.setValueAtTime(f, ac.currentTime + delay);
    o.frequency.exponentialRampToValueAtTime(f * 0.8, ac.currentTime + delay + d * 0.8);
    g.gain.setValueAtTime(v, ac.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + d);
    o.start(ac.currentTime + delay);
    o.stop(ac.currentTime + delay + d + 0.01);
  } catch {}
}

const SFX = {
  draw() { tone(440, "square", 0.055, 0.1); tone(560, "square", 0.04, 0.08, 0.05); },
  discard() { tone(300, "sawtooth", 0.09, 0.12); tone(210, "sawtooth", 0.055, 0.08, 0.08); },
  peng() { [600, 720, 860].forEach((f, i) => tone(f, "square", 0.06, 0.14, i * 0.06)); },
  chi() { [500, 660, 820].forEach((f, i) => tone(f, "square", 0.06, 0.12, i * 0.07)); },
  gang() { [600, 700, 800, 920].forEach((f, i) => tone(f, "square", 0.06, 0.14, i * 0.04)); setTimeout(() => tone(1200, "sine", 0.14, 0.12), 200); },
  hu() {
    [523, 659, 784, 1047].forEach((f, i) => { tone(f, "sine", 0.22, 0.2, i * 0.14); tone(f * 0.5, "square", 0.16, 0.1, i * 0.14); });
    setTimeout(() => { tone(1047, "sine", 0.4, 0.25); tone(523, "sine", 0.4, 0.14); }, 650);
  },
  click() { tone(800, "square", 0.03, 0.06); },
  err() { tone(180, "sawtooth", 0.18, 0.12); },
  notif() { tone(880, "sine", 0.07, 0.09); tone(1100, "sine", 0.055, 0.07, 0.1); },
};

// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?//  LOCAL GAME STATE
// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
interface GameData {
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
  selIdx: number;
  players: Player[];
  cfg: GameConfig;
  aiT: ReturnType<typeof setTimeout> | null;
  turnSeq: number;
  meldExpanded: Record<number, boolean>;
  _pendingBtns: string[];
  _chiOptions: Tile[][];
  _reacts: Record<number, string[]> | null;
  _reactFrom: number;
  _reactTile: Tile | null;
}

const REACT_CHOICE_MS = 6000;
const MP_SESSION_KEY = "mahjong_mp_session";

// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?//  MULTIPLAYER TYPES
// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
type MPRoomPlayer = { id: string; name: string; isAI: boolean; score: number };
type MPSession = { code: string; playerId: string; isHost: boolean };
type MPView = {
  phase: string;
  myIndex: number;
  players: { name: string; score: number; isAI: boolean }[];
  hand: Tile[];
  handCounts: number[];
  melds: Meld[][];
  discs: Tile[][];
  cur: number;
  lastD: Tile | null;
  lastDpid: number;
  tilesLeft: number;
  round: number;
  dealer: number;
  myActions: string[];
  chiOpts: Tile[][] | null;
  result: { winner: number; fan: FanResult; delta: number[]; isSelf: boolean; isDraw: boolean } | null;
  cfg: GameConfig;
  seq: number;
};

// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?//  COMPONENT
// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
export default function MahjongClient() {
  const { user } = useAuth();
  // screen: lobby | local-game | mp-waiting | mp-game
  const [screen, setScreen] = useState<"lobby" | "local-game" | "mp-waiting" | "mp-game">("lobby");
  const [lobbyMode, setLobbyMode] = useState<"choose" | "local" | "mp">("choose");
  const [cfg, setCfg] = useState<GameConfig>({ name: user?.username || "玩家", score: 1000, base: 10, punish: "喝一杯！", pthr: 0 });

  // 鈹€鈹€ Local game state 鈹€鈹€
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const G = useRef<GameData>({
    deck: [], di: 0, hands: [[], [], [], []], melds: [[], [], [], []], discs: [[], [], [], []],
    phase: "idle", cur: 0, lastD: null, lastDpid: -1, round: 0, dealer: 0,
    selIdx: -1, players: [], cfg: { name: user?.username || "玩家", score: 1000, base: 10, punish: "喝一杯！", pthr: 0 },
    aiT: null, turnSeq: 0, meldExpanded: {},
    _pendingBtns: [], _chiOptions: [], _reacts: null, _reactFrom: -1, _reactTile: null,
  });
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate((n) => n + 1);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{ winner: number; fan: FanResult; delta: number[]; isSelf: boolean; isDraw: boolean } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [notif, setNotif] = useState("");
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // 鈹€鈹€ Multiplayer state 鈹€鈹€
  const [mpCode, setMpCode] = useState("");
  const [mpPlayerId, setMpPlayerId] = useState("");
  const [mpPlayers, setMpPlayers] = useState<MPRoomPlayer[]>([]);
  const [mpIsHost, setMpIsHost] = useState(false);
  const [mpView, setMpView] = useState<MPView | null>(null);
  const [mpSelIdx, setMpSelIdx] = useState(-1);
  const [mpJoinCode, setMpJoinCode] = useState("");
  const [mpError, setMpError] = useState("");
  const mpPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mpNotif] = useState("");

  // 鈹€鈹€ Helpers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  const logIt = useCallback((msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 12));
  }, []);

function getMpClientId() {
  if (typeof window === "undefined") return "server";
  const key = "mahjong_mp_client_id";
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      window.localStorage.setItem(key, id);
  }
  return id;
}

function readMPSession(): MPSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(MP_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<MPSession>;
    if (!parsed?.code || !parsed?.playerId) return null;

    return {
      code: parsed.code,
      playerId: parsed.playerId,
      isHost: Boolean(parsed.isHost),
    };
  } catch {
    return null;
  }
}

function writeMPSession(session: MPSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MP_SESSION_KEY, JSON.stringify(session));
}

function clearMPSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MP_SESSION_KEY);
}

function getMpSeatName(cfgName: string, authName: string | undefined) {
  const auth = authName?.trim() || "";
  const typed = cfgName.trim();
  const base = auth || (typed && typed !== "玩家" ? typed : "玩家");
  return `${base}-${getMpClientId().slice(-4)}`;
}

  const showNotif = useCallback((msg: string) => {
    setNotif(msg);
    SFX.notif();
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotif(""), 2000);
  }, []);

  // update name when auth loads
  useEffect(() => {
    if (user?.username) setCfg((c) => ({ ...c, name: user.username }));
  }, [user?.username]);

  // 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?  //  LOCAL GAME LOGIC (unchanged)
  // 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
  function startLocal() {
    clearAI();
    G.current.turnSeq++;
    const p: Player[] = [
      { name: cfg.name, score: cfg.score, isHuman: true },
      { name: "机器人甲", score: cfg.score, isHuman: false },
      { name: "机器人乙", score: cfg.score, isHuman: false },
      { name: "机器人丙", score: cfg.score, isHuman: false },
    ];
    G.current.players = p;
    G.current.cfg = { ...cfg };
    G.current.round = 0;
    G.current.dealer = Math.floor(Math.random() * 4);
    setLocalPlayers([...p]);
    setScreen("local-game");
    SFX.click();
    scheduleLocal(() => initRound(), 300);
  }

  function initRound() {
    const g = G.current;
    clearAI();
    const ticket = ++g.turnSeq;
    g.deck = shuffle(makeDeck());
    g.di = 0;
    g.hands = [[], [], [], []];
    g.melds = [[], [], [], []];
    g.discs = [[], [], [], []];
    g.phase = "idle";
    g.selIdx = -1;
    g.meldExpanded = {};
    g.round++;
    g.lastD = null;
    g.lastDpid = -1;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 13; j++) g.hands[i].push(g.deck[g.di++]);
    for (let i = 0; i < 4; i++) sortHand(g.hands[i]);
    setLocalPlayers([...g.players]);
    logIt(`第${g.round}局 · 庄：${g.players[g.dealer].name}`);
    rerender();
    g.aiT = setTimeout(() => {
      if (G.current.turnSeq !== ticket) return;
      turn(g.dealer);
    }, 600);
  }

  function drawTile(pid: number): { tile: Tile; index: number } | null {
    const g = G.current;
    if (g.di >= g.deck.length) return null;
    const t = g.deck[g.di++];
    const hand = g.hands[pid];
    const idx = hand.findIndex((x) => tileOrder(x) > tileOrder(t));
    if (idx < 0) {
      hand.push(t);
      return { tile: t, index: hand.length - 1 };
    }
    hand.splice(idx, 0, t);
    return { tile: t, index: idx };
  }

  function turn(pid: number) {
    const g = G.current;
    clearAI();
    const ticket = ++g.turnSeq;
    g.cur = pid;
    g.phase = "prediscard";
    sortHand(g.hands[pid]);
    const drawn = drawTile(pid);
    if (!drawn) { endNoWin(); return; }
    SFX.draw();
    logIt(`${g.players[pid].name} 摸牌`);
    if (pid === 0) g.selIdx = drawn.index;
    rerender();
    if (pid === 0) {
      g.phase = "discard";
      const hu = selfDrawOk(g.hands[0], g.melds[0]);
      const gangs = selfGangs(g.hands[0], g.melds[0]);
      g._pendingBtns = ["discard"];
      if (hu) g._pendingBtns.unshift("hu");
      if (gangs.length) g._pendingBtns.splice(g._pendingBtns.length - 1, 0, "gang_self");
      rerender();
    } else {
      g.aiT = setTimeout(() => {
        if (G.current.turnSeq !== ticket) return;
        aiTurn(pid);
      }, 700 + Math.random() * 500);
    }
  }

  function aiTurn(pid: number) {
    const g = G.current;
    if (selfDrawOk(g.hands[pid], g.melds[pid])) { declareHu(pid, null, true); return; }
    const gs = selfGangs(g.hands[pid], g.melds[pid]);
    if (gs.length && Math.random() < 0.65) { doGang(pid, gs[0], "self"); return; }
    doDiscard(pid, aiPick(g.hands[pid]));
  }

  function doDiscard(pid: number, idx: number) {
    const g = G.current;
    const tile = g.hands[pid].splice(idx, 1)[0];
    g.discs[pid].push(tile);
    g.lastD = tile;
    g.lastDpid = pid;
    g.phase = "react";
    g.selIdx = -1;
    g._pendingBtns = [];
    SFX.discard();
    logIt(`${g.players[pid].name} 打出 <span style="color:#b89a40">${tileName(tile)}</span>`);
    rerender();
    checkReact(pid, tile);
  }

  function humanDiscard() {
    const g = G.current;
    if (g.phase !== "discard" || g.selIdx < 0) { SFX.err(); showNotif("请先选择一张牌"); return; }
    doDiscard(0, g.selIdx);
  }

  function checkReact(from: number, tile: Tile) {
    const g = G.current;
    const reacts: Record<number, string[]> = {};
    let any = false;
    for (let i = 0; i < 4; i++) {
      if (i === from) continue;
      const r: string[] = [];
      if (huOnTile(g.hands[i], g.melds[i], tile)) r.push("hu");
      if (canPeng(g.hands[i], tile)) r.push("peng");
      if (canGangDiscard(g.hands[i], tile)) r.push("gang");
      if (canChi(g.hands[i], tile, from, i).length) r.push("chi");
      if (r.length) { reacts[i] = r; any = true; }
    }
    g._reacts = reacts;
    g._reactFrom = from;
    g._reactTile = tile;
    if (!any) { schedNext(from); return; }
    for (let i = 0; i < 4; i++) {
      if (reacts[i]?.includes("hu")) {
        if (i === 0) {
          g._pendingBtns = [...new Set(["hu", ...(reacts[0] || []), "pass"])];
          rerender();
        } else {
          scheduleLocal(() => declareHu(i, tile, false), 500);
        }
        return;
      }
    }
    if (reacts[0]) {
      g._pendingBtns = [...reacts[0], "pass"];
      rerender();
      scheduleLocal(() => aiReact(reacts, from, tile), REACT_CHOICE_MS);
    } else {
      aiReact(reacts, from, tile);
    }
  }

  function aiReact(reacts: Record<number, string[]>, from: number, tile: Tile) {
    clearAI();
    for (let i = 1; i < 4; i++) {
      if (!reacts[i]) continue;
      if (reacts[i].includes("hu")) { scheduleLocal(() => declareHu(i, tile, false), 500); return; }
      if (reacts[i].includes("gang")) { scheduleLocal(() => doGang(i, tile, "discard"), 350); return; }
      if (reacts[i].includes("peng")) { scheduleLocal(() => doPeng(i, tile), 350); return; }
      const chi = canChi(G.current.hands[i], tile, from, i);
      if (chi.length) { scheduleLocal(() => doChi(i, tile, chi[0]), 350); return; }
    }
    schedNext(from);
  }

  function passReact() {
    clearAI();
    const g = G.current;
    g._pendingBtns = [];
    // Remove human's reactions, then process remaining AI reactions
    if (g._reacts) {
      delete g._reacts[0];
      if (Object.keys(g._reacts).length > 0) {
        aiReact(g._reacts, g._reactFrom, g._reactTile!);
      } else {
        schedNext(g._reactFrom);
      }
    }
    rerender();
  }

  function schedNext(from: number) {
    const g = G.current;
    clearAI();
    const ticket = ++g.turnSeq;
    g.aiT = setTimeout(() => {
      if (G.current.turnSeq !== ticket) return;
      turn((from + 1) % 4);
    }, 250);
  }
  function clearAI() { if (G.current.aiT) { clearTimeout(G.current.aiT); G.current.aiT = null; } }
  function scheduleLocal(cb: () => void, delay: number) {
    const g = G.current;
    clearAI();
    const ticket = g.turnSeq;
    g.aiT = setTimeout(() => {
      if (G.current.turnSeq !== ticket) return;
      cb();
    }, delay);
  }

  function doPeng(pid: number, tile: Tile) {
    const g = G.current;
    clearAI();
    g._pendingBtns = [];
    const pengTiles: Tile[] = [tile];
    let rm = 0;
    g.hands[pid] = g.hands[pid].filter((t) => { if (t.id === tile.id && rm < 2) { rm++; pengTiles.push(t); return false; } return true; });
    g.melds[pid].push({ type: "peng", tiles: pengTiles });
    SFX.peng();
    logIt(`${g.players[pid].name} <span style="color:#b89a40">碰 ${tileName(tile)}</span>`);
    showNotif(`${g.players[pid].name} 碰牌`);
    rerender();
    if (pid === 0) { g.phase = "discard"; g._pendingBtns = ["discard"]; rerender(); }
    else scheduleLocal(() => doDiscard(pid, aiPick(g.hands[pid])), 700);
  }

  function doChi(pid: number, tile: Tile, seq: Tile[]) {
    const g = G.current;
    clearAI();
    g._pendingBtns = [];
    g._chiOptions = [];
    for (const t of seq) {
      if (t.id === tile.id && t.suit === tile.suit && t.n === tile.n) continue;
      const i = g.hands[pid].findIndex((h) => h.id === t.id);
      if (i >= 0) g.hands[pid].splice(i, 1);
    }
    g.melds[pid].push({ type: "chi", tiles: seq });
    SFX.chi();
    logIt(`${g.players[pid].name} <span style="color:#b89a40">吃 ${seq.map(tileName).join("")}</span>`);
    showNotif(`${g.players[pid].name} 吃牌`);
    rerender();
    if (pid === 0) { g.phase = "discard"; g._pendingBtns = ["discard"]; rerender(); }
    else scheduleLocal(() => doDiscard(pid, aiPick(g.hands[pid])), 700);
  }

  function doGang(pid: number, tile: Tile, type: "self" | "discard") {
    const g = G.current;
    clearAI();
    g._pendingBtns = [];
    if (type === "self") {
      const pi = g.melds[pid].findIndex((m) => m.type === "peng" && m.tiles[0].id === tile.id);
      if (pi >= 0) {
        g.melds[pid][pi].type = "gang_open";
        g.melds[pid][pi].tiles.push(tile);
        g.hands[pid] = g.hands[pid].filter((t) => t.id !== tile.id);
      } else {
        const gangTiles = g.hands[pid].filter((t) => t.id === tile.id);
        g.hands[pid] = g.hands[pid].filter((t) => t.id !== tile.id);
        g.melds[pid].push({ type: "gang_hidden", tiles: gangTiles });
      }
    } else {
      const gangTiles: Tile[] = [tile];
      let rm = 0;
      g.hands[pid] = g.hands[pid].filter((t) => { if (t.id === tile.id && rm < 3) { rm++; gangTiles.push(t); return false; } return true; });
      g.melds[pid].push({ type: "gang_open", tiles: gangTiles });
    }
    SFX.gang();
    const lbl = type === "self" ? "暗杠" : "明杠";
    logIt(`${g.players[pid].name} <span style="color:#b89a40">${lbl} ${tileName(tile)}</span>`);
    showNotif(`${g.players[pid].name} ${lbl}`);
    rerender();
    const drawn = drawTile(pid);
    if (!drawn) { endNoWin(); return; }
    SFX.draw();
    if (pid === 0) g.selIdx = drawn.index;
    if (pid === 0) {
      g.phase = "discard";
      g._pendingBtns = selfDrawOk(g.hands[0], g.melds[0]) ? ["hu", "discard"] : ["discard"];
      rerender();
    } else {
      if (selfDrawOk(g.hands[pid], g.melds[pid])) { declareHu(pid, null, true); return; }
      scheduleLocal(() => doDiscard(pid, aiPick(g.hands[pid])), 700);
    }
  }

  function declareHu(pid: number, disc: Tile | null, isSelf: boolean) {
    const g = G.current;
    clearAI();
    g._pendingBtns = [];
    const hand = disc ? [...g.hands[pid], disc] : g.hands[pid];
    const fan = calcFan(hand, g.melds[pid], isSelf);
    SFX.hu();
    logIt(`${g.players[pid].name} 胡牌 ${fan.total}番`);
    showNotif("胡牌");
    const base = g.cfg.base || 10;
    const pts = fan.total * base;
    const delta = [0, 0, 0, 0];
    if (isSelf) {
      for (let i = 0; i < 4; i++) if (i !== pid) { delta[i] = -pts; delta[pid] += pts; }
    } else {
      delta[g.lastDpid] = -pts;
      delta[pid] = pts;
    }
    for (let i = 0; i < 4; i++) g.players[i].score += delta[i];
    g.dealer = pid;
    setLocalPlayers([...g.players]);
    setResultData({ winner: pid, fan, delta, isSelf, isDraw: false });
    setShowResult(true);
    rerender();
  }

  function endNoWin() {
    logIt("流局");
    showNotif("流局");
    setResultData({ winner: -1, fan: { total: 0, desc: "" }, delta: [0, 0, 0, 0], isSelf: false, isDraw: true });
    setShowResult(true);
  }

  function handleAction(action: string) {
    const g = G.current;
    SFX.click();
    const tile = g._reactTile as Tile | null;
    const from = g._reactFrom ?? -1;
    if (action === "hu") {
      g._pendingBtns = [];
      if (tile && g.phase === "react") declareHu(0, tile, false);
      else declareHu(0, null, true);
    } else if (action === "peng") {
      clearAI(); g._pendingBtns = []; doPeng(0, tile!);
    } else if (action === "chi") {
      const opts = canChi(g.hands[0], tile!, from, 0);
      if (opts.length === 1) { clearAI(); doChi(0, tile!, opts[0]); }
      else { g._chiOptions = opts; rerender(); }
    } else if (action === "gang") {
      clearAI(); g._pendingBtns = []; doGang(0, tile!, "discard");
    } else if (action === "gang_self") {
      const gs = selfGangs(g.hands[0], g.melds[0]);
      clearAI(); g._pendingBtns = []; doGang(0, gs[0], "self");
    } else if (action === "discard") {
      humanDiscard();
    } else if (action === "pass") {
      passReact();
    }
    rerender();
  }

  function handleTileClick(idx: number) {
    const g = G.current;
    if (g.phase !== "discard") return;
    SFX.click();
    g.selIdx = g.selIdx === idx ? -1 : idx;
    rerender();
  }

  async function backLobby() {
    clearAI();
    G.current.turnSeq++;
    stopMPPoll();
    if ((screen === "mp-waiting" || screen === "mp-game") && mpCode && mpPlayerId) {
      await leaveMpRoom();
    }
    G.current.phase = "idle";
    G.current._pendingBtns = [];
    G.current._chiOptions = [];
    setShowResult(false);
    setLobbyMode("choose");
    setScreen("lobby");
    setLogs([]);
    setMpError("");
  }

  function nextRound() {
    setShowResult(false);
    initRound();
  }

  async function leaveMpRoom() {
    if (!mpCode || !mpPlayerId) {
      clearMPSession();
      return;
    }

    try {
      const res = await fetch("/api/mahjong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leave",
          code: mpCode,
          playerId: mpPlayerId,
          clientId: getMpClientId(),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (data?.error && data.error !== "房间不存在") {
          setMpError(data.error);
        }
      }
    } catch {
      // Ignore leave failures; the local client is already leaving.
    } finally {
      clearMPSession();
      setMpView(null);
      setMpPlayers([]);
      setMpPlayerId("");
      setMpCode("");
      setMpIsHost(false);
      setMpJoinCode("");
    }
  }

  // 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?  //  MULTIPLAYER LOGIC
  // 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
  async function enterMpRoom(code: string, playerId: string, isHost: boolean, players: MPRoomPlayer[], view: MPView | null = null) {
    setMpCode(code);
    setMpPlayerId(playerId);
    setMpIsHost(isHost);
    setMpPlayers(players);
    setMpJoinCode(code);
    writeMPSession({ code, playerId, isHost });

    if (view) {
      setMpView(view);
      setScreen(view.phase === "waiting" ? "mp-waiting" : "mp-game");
    } else {
      setMpView(null);
      setScreen("mp-waiting");
    }

    startMPPoll(code, playerId);
  }

  async function resumeMpRoom(session: MPSession) {
    const res = await fetch("/api/mahjong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resume",
        code: session.code,
        playerId: session.playerId,
        clientId: getMpClientId(),
      }),
    });
    const data = (await res.json().catch(() => null)) as
      | {
          ok?: boolean;
          error?: string;
          playerId?: string;
          isHost?: boolean;
          players?: MPRoomPlayer[];
          view?: MPView;
        }
      | null;

    if (!data?.ok || !data.playerId || !data.players) {
      clearMPSession();
      setMpView(null);
      setMpPlayers([]);
      setMpCode("");
      setMpPlayerId("");
      setMpIsHost(false);
      setScreen("lobby");
      return false;
    }

    await enterMpRoom(session.code, data.playerId, Boolean(data.isHost), data.players, data.view ?? null);
    return true;
  }

  async function mpCreate() {
    setMpError("");
    SFX.click();
    const res = await fetch("/api/mahjong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", clientId: getMpClientId(), name: getMpSeatName(cfg.name, user?.username), score: cfg.score, base: cfg.base, punish: cfg.punish, pthr: cfg.pthr }),
    });
    const data = await res.json();
    if (!data.ok) { setMpError(data.error || "创建失败"); return; }
    await enterMpRoom(data.code, data.playerId, true, data.players);
  }

  async function mpJoin() {
    if (!mpJoinCode.trim()) { setMpError("请输入房间号"); return; }
    setMpError("");
    SFX.click();
    const res = await fetch("/api/mahjong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", clientId: getMpClientId(), code: mpJoinCode.trim(), name: getMpSeatName(cfg.name, user?.username) }),
    });
    const data = await res.json();
    if (!data.ok) { setMpError(data.error || "加入失败"); return; }
    await enterMpRoom(mpJoinCode.trim(), data.playerId, false, data.players);
  }

  async function mpAddAI() {
    SFX.click();
    const res = await fetch("/api/mahjong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addAI", code: mpCode, playerId: mpPlayerId }),
    });
    const data = await res.json();
    if (data.ok) setMpPlayers([...data.players]);
  }

  async function mpStart() {
    SFX.click();
    const res = await fetch("/api/mahjong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", code: mpCode, playerId: mpPlayerId }),
    });
    const data = await res.json();
    if (!data.ok) { setMpError(data.error || "开始失败"); return; }
    setMpError("");
  }

  async function mpNextRound() {
    SFX.click();
    const res = await fetch("/api/mahjong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "next", code: mpCode, playerId: mpPlayerId }),
    });
    const data = await res.json();
    if (data.ok && data.view) {
      setMpView(data.view);
      setMpSelIdx(-1);
    }
  }

  async function mpSendAction(act: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/mahjong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "act", code: mpCode, playerId: mpPlayerId, act, ...extra }),
    });
    const data = await res.json();
    if (data.ok && data.view) {
      setMpView(data.view);
      setMpSelIdx(-1);
    }
  }

  function startMPPoll(code: string, playerId: string) {
    stopMPPoll();
    mpPollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/mahjong", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "poll", code, playerId }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; view?: MPView } | null;
        if (!data?.ok || !data.view) {
          if (res.status === 403 || res.status === 404) {
            stopMPPoll();
            clearMPSession();
            setMpView(null);
            setMpPlayers([]);
            setMpCode("");
            setMpPlayerId("");
            setMpIsHost(false);
            setScreen("lobby");
          }
          return;
        }
        const view = data.view;

        if (view.phase === "waiting") {
          setMpPlayers(view.players as MPRoomPlayer[]);
          setScreen("mp-waiting");
          return;
        }

        setMpView(view);
        setScreen("mp-game");
      } catch {}
    }, 800);
  }

  function stopMPPoll() {
    if (mpPollRef.current) {
      clearInterval(mpPollRef.current);
      mpPollRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopMPPoll();
  }, []);

  useEffect(() => {
    const session = readMPSession();
    if (!session) return;
    setMpJoinCode(session.code);
    setScreen("mp-waiting");
    void resumeMpRoom(session);
  }, []);

  // 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?  //  RENDER
  // 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
  // 鈹€鈹€ LOBBY 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  if (screen === "lobby") {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300">
        <section className="mx-auto max-w-2xl px-6 py-16">
          <div className="mb-4">
            <Link href="/fun" className="inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]">
              返回娱乐页
            </Link>
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">游戏</span>
          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">湖州麻将</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
            基于湖州麻将规则的网页小游戏，白板为百搭牌，支持碰、杠、吃、胡。
          </p>

          {lobbyMode === "choose" && (
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setLobbyMode("local")}
                className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 text-left backdrop-blur-sm transition-transform hover:scale-[1.01]"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">本地</div>
                <div className="mt-3 text-2xl font-bold">单机对局</div>
                <div className="mt-3 text-sm leading-6 text-[var(--app-muted)]">先配置好规则，直接开一局本地麻将。</div>
              </button>
              <button
                onClick={() => setLobbyMode("mp")}
                className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 text-left backdrop-blur-sm transition-transform hover:scale-[1.01]"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">联机</div>
                <div className="mt-3 text-2xl font-bold">在线房间</div>
                <div className="mt-3 text-sm leading-6 text-[var(--app-muted)]">创建或加入房间，和别人一起打。</div>
              </button>
            </div>
          )}

          {lobbyMode === "local" && (
            <div className="mt-10 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between gap-3 border-b border-[var(--app-border)] pb-4">
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--app-muted)]">本地对局</h3>
                <button onClick={() => setLobbyMode("choose")} className="text-xs text-[var(--app-muted)] hover:text-[var(--app-fg)]">返回选择</button>
              </div>
              <div className="space-y-4">
                <RowInput label="你的名字" value={cfg.name} onChange={(v) => setCfg({ ...cfg, name: v })} />
                <RowInput label="初始积分" type="number" value={String(cfg.score)} onChange={(v) => setCfg({ ...cfg, score: +v || 1000 })} />
                <RowInput label="底分" type="number" value={String(cfg.base)} onChange={(v) => setCfg({ ...cfg, base: +v || 10 })} />
                <RowInput label="惩罚文本" value={cfg.punish} onChange={(v) => setCfg({ ...cfg, punish: v })} />
                <RowInput label="惩罚阈值" type="number" value={String(cfg.pthr)} onChange={(v) => setCfg({ ...cfg, pthr: +v || 0 })} />
              </div>
              <button onClick={startLocal} className="mt-8 w-full rounded-xl bg-[var(--app-fg)] px-6 py-3.5 text-sm font-semibold text-[var(--app-bg)] tracking-wider transition-transform hover:scale-[1.01] active:scale-[0.99]">
                开始对局
              </button>
            </div>
          )}

          {lobbyMode === "mp" && (
            <div className="mt-10 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between gap-3 border-b border-[var(--app-border)] pb-4">
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--app-muted)]">联机对局</h3>
                <button onClick={() => setLobbyMode("choose")} className="text-xs text-[var(--app-muted)] hover:text-[var(--app-fg)]">返回选择</button>
              </div>
              <div className="space-y-4">
                <RowInput label="你的名字" value={cfg.name} onChange={(v) => setCfg({ ...cfg, name: v })} />
                <RowInput label="初始积分" type="number" value={String(cfg.score)} onChange={(v) => setCfg({ ...cfg, score: +v || 1000 })} />
                <RowInput label="底分" type="number" value={String(cfg.base)} onChange={(v) => setCfg({ ...cfg, base: +v || 10 })} />
                <RowInput label="惩罚文本" value={cfg.punish} onChange={(v) => setCfg({ ...cfg, punish: v })} />
                <RowInput label="惩罚阈值" type="number" value={String(cfg.pthr)} onChange={(v) => setCfg({ ...cfg, pthr: +v || 0 })} />
              </div>
              <button onClick={mpCreate} className="mt-8 w-full rounded-xl bg-[var(--app-fg)] px-6 py-3.5 text-sm font-semibold text-[var(--app-bg)] tracking-wider transition-transform hover:scale-[1.01] active:scale-[0.99]">
                创建房间
              </button>

              <div className="mt-6 flex items-center gap-3">
                <input
                  value={mpJoinCode}
                  onChange={(e) => setMpJoinCode(e.target.value)}
                  placeholder="输入房间号"
                  className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-fg)] text-center outline-none focus:border-[var(--mahjong-gold)]"
                  maxLength={6}
                />
                <button onClick={mpJoin} className="rounded-xl border border-[var(--app-border)] px-6 py-2.5 text-sm font-semibold text-[var(--app-fg)] tracking-wider hover:border-[var(--app-border-strong)]">
                  加入房间
                </button>
              </div>
              {mpError && <p className="mt-3 text-sm text-red-500">{mpError}</p>}
            </div>
          )}

          <button onClick={() => setShowRules(true)} className="mt-6 text-sm text-[var(--app-muted)] hover:text-[var(--app-fg)] transition-colors underline underline-offset-4">
            查看规则
          </button>
        </section>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </div>
    );
  }

  // 鈹€鈹€ WAITING ROOM 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  if (screen === "mp-waiting") {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300">
        <section className="mx-auto max-w-2xl px-6 py-16">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">联机</span>
          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">湖州麻将</h1>

          <div className="mt-10 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">房间号</p>
            <p className="mt-2 text-4xl font-bold tracking-[0.3em]" style={{ color: "var(--mahjong-gold)" }}>{mpCode}</p>
            <p className="mt-2 text-xs text-[var(--app-muted)]">把房间号发给朋友就能加入</p>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm">
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--app-muted)] mb-4">玩家列表 ({mpPlayers.length}/4)</h3>
            <div className="space-y-2">
              {mpPlayers.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--app-border)] px-4 py-3">
                  <span className="text-sm font-medium">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--mahjong-gold)]" style={{ color: "var(--mahjong-gold)" }}>房主</span>}
                    {p.isAI && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--app-border)] text-[var(--app-muted)]">AI</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              {mpIsHost && mpPlayers.length < 4 && (
                <button onClick={mpAddAI} className="flex-1 rounded-xl border border-[var(--app-border)] px-4 py-3 text-sm text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]">
                  添加 AI
                </button>
              )}
              {mpIsHost && mpPlayers.length >= 2 && (
                <button onClick={mpStart} className="flex-1 rounded-xl bg-[var(--app-fg)] px-4 py-3 text-sm font-semibold text-[var(--app-bg)] tracking-wider">
                  开始游戏
                </button>
              )}
              {!mpIsHost && (
                <p className="text-sm text-[var(--app-muted)] text-center w-full">等待房主开始游戏…</p>
              )}
            </div>
          </div>

          <button onClick={backLobby} className="mt-6 text-sm text-[var(--app-muted)] hover:text-[var(--app-fg)] transition-colors underline underline-offset-4">
            离开房间
          </button>
        </section>
      </div>
    );
  }

  // 鈹€鈹€ LOCAL GAME 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  if (screen === "local-game") {
    const g = G.current;
    const tilesLeft = g.deck.length - g.di;
    const winds = ["东", "南", "西", "北"];
    const windOf = (i: number) => winds[(i - g.dealer + 4) % 4];
    const roundWind = () => {
      const ws = ["东", "南", "西", "北"];
      const ns = ["一", "二", "三", "四"];
      const wi = Math.floor((g.round - 1) / 4) % 4;
      const ri = ((g.round - 1) % 4) + 1;
      return `${ws[wi]}${ns[ri - 1]}局`;
    };

    return (
      <div className="mahjong-game">
        <div className="mahjong-topbar">
          <button className="mahjong-tb" onClick={() => setShowRules(true)}>规则</button>
          <button className="mahjong-tb" onClick={() => { sfxOn = !sfxOn; rerender(); }}>{sfxOn ? "🔊" : "🔇"}</button>
          <button className="mahjong-tb" onClick={backLobby}>返回</button>
        </div>
        <div className="mahjong-grid">
          <div className="mahjong-zone-top">
            <PlayerHud player={localPlayers[2]} wind={windOf(2)} isDealer={g.dealer === 2} isCurrent={g.cur === 2} tileCount={g.hands[2].length} />
            <div className="mahjong-hand-row"><HandTiles pid={2} hand={g.hands[2]} /><MeldDisplay pid={2} melds={g.melds[2]} /></div>
          </div>
          <div className="mahjong-zone-left">
            <div className="mahjong-rotated-90">
              <PlayerHud player={localPlayers[3]} wind={windOf(3)} isDealer={g.dealer === 3} isCurrent={g.cur === 3} tileCount={g.hands[3].length} />
              <div className="mahjong-hand-row"><HandTiles pid={3} hand={g.hands[3]} /><MeldDisplay pid={3} melds={g.melds[3]} /></div>
            </div>
          </div>
          <div className="mahjong-zone-center">
            <div className="mahjong-center-box">
              <DiscardZone pid={2} discs={g.discs[2]} lastDiscPid={g.lastDpid} pos="top" />
              <DiscardZone pid={3} discs={g.discs[3]} lastDiscPid={g.lastDpid} pos="left" />
              <div className="mahjong-center-info">
                <div className="mahjong-round-badge">
                  <div className="text-base font-semibold" style={{ color: "var(--mahjong-gold)" }}>{roundWind()}</div>
                  <div className="text-[10px] mt-1" style={{ color: "#888" }}>剩余 {tilesLeft} 张</div>
                </div>
              </div>
              <DiscardZone pid={1} discs={g.discs[1]} lastDiscPid={g.lastDpid} pos="right" />
              <DiscardZone pid={0} discs={g.discs[0]} lastDiscPid={g.lastDpid} pos="bottom" />
            </div>
          </div>
          <div className="mahjong-zone-right">
            <div className="mahjong-rotated-neg90">
              <PlayerHud player={localPlayers[1]} wind={windOf(1)} isDealer={g.dealer === 1} isCurrent={g.cur === 1} tileCount={g.hands[1].length} />
              <div className="mahjong-hand-row"><HandTiles pid={1} hand={g.hands[1]} /><MeldDisplay pid={1} melds={g.melds[1]} /></div>
            </div>
          </div>
          <div className="mahjong-zone-bottom">
            <PlayerHud player={localPlayers[0]} wind={windOf(0)} isDealer={g.dealer === 0} isCurrent={g.cur === 0} />
            <div className="mahjong-hand-row"><MeldDisplay pid={0} melds={g.melds[0]} /><HumanHand hand={g.hands[0]} selIdx={g.selIdx} onClick={handleTileClick} /></div>
          </div>
        </div>
        {g._pendingBtns && g._pendingBtns.length > 0 && (
          <div className="mahjong-action-bar">
            {g._pendingBtns.map((a) => (
              <button key={a} className={`mahjong-ab mahjong-ab-${a === "gang_self" ? "gang" : a}`} onClick={() => handleAction(a)}>
                {{ hu: "胡", peng: "碰", chi: "吃", gang: "杠", gang_self: "杠", pass: "过", discard: "出牌" }[a] || a}
              </button>
            ))}
          </div>
        )}
        {g._chiOptions && g._chiOptions.length > 1 && (
          <div className="mahjong-chi-panel">
            <div className="text-[11px] mb-2 tracking-wider" style={{ color: "#888" }}>选择吃牌方式</div>
            <div className="flex gap-3">
              {g._chiOptions.map((seq, si) => (
                <div key={si} className="mahjong-chi-opt" onClick={() => { clearAI(); doChi(0, g._reactTile!, seq); g._chiOptions = []; rerender(); }}>
                  {seq.map((t, ti) => <TileComponent key={ti} tile={t} size="small" />)}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mahjong-log" ref={logRef}>
          {logs.map((l, i) => <div key={i} className="mahjong-log-entry" dangerouslySetInnerHTML={{ __html: l }} />)}
        </div>
        {notif && <div className="mahjong-notif">{notif}</div>}
        {showResult && resultData && (
          <ResultOverlay
            players={localPlayers}
            result={resultData}
            cfg={g.cfg}
            isLocal
            onNext={nextRound}
            onBack={backLobby}
          />
        )}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </div>
    );
  }

  // 鈹€鈹€ MULTIPLAYER GAME 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  if (screen === "mp-game" && mpView) {
    const v = mpView;
    const seatPlayers: Player[] = [
      ...v.players.slice(v.myIndex),
      ...v.players.slice(0, v.myIndex),
    ].map((p) => ({ name: p.name, score: p.score, isHuman: !p.isAI }));
    const winds = ["东", "南", "西", "北"];
    const windOf = (i: number) => winds[(i - v.dealer + 4) % 4];
    const roundWind = () => {
      const ws = ["东", "南", "西", "北"];
      const ns = ["一", "二", "三", "四"];
      const wi = Math.floor((v.round - 1) / 4) % 4;
      const ri = ((v.round - 1) % 4) + 1;
      return `${ws[wi]}${ns[ri - 1]}局`;
    };

    function mpHandleTileClick(idx: number) {
      if (!v.myActions.includes("discard")) return;
      SFX.click();
      setMpSelIdx((prev) => (prev === idx ? -1 : idx));
    }

    function mpHandleAction(act: string) {
      SFX.click();
      if (act === "discard") {
        if (mpSelIdx < 0) { SFX.err(); return; }
        mpSendAction("discard", { idx: mpSelIdx });
      } else if (act === "chi_choose") {
        // should be handled by chi options panel
      } else {
        mpSendAction(act);
      }
    }

    function mpHandleChiChoose(seqIdx: number) {
      SFX.click();
      mpSendAction("chi_choose", { seqIdx });
    }

    return (
      <div className="mahjong-game">
        <div className="mahjong-topbar">
          <button className="mahjong-tb" onClick={() => setShowRules(true)}>规则</button>
          <button className="mahjong-tb" onClick={() => { sfxOn = !sfxOn; rerender(); }}>{sfxOn ? "🔊" : "🔇"}</button>
          <button className="mahjong-tb" onClick={backLobby}>返回</button>
        </div>
        <div className="mahjong-grid">
          {/* Top: relative index 2 */}
          <div className="mahjong-zone-top">
            <PlayerHud player={seatPlayers[2]} wind={windOf(2)} isDealer={v.dealer === 2} isCurrent={v.cur === 2} tileCount={v.handCounts?.[2] ?? 13} />
            <div className="mahjong-hand-row">
              <HandTiles pid={2} hand={Array(v.handCounts?.[2] ?? 13).fill(null)} />
              <MeldDisplay pid={2} melds={v.melds[2]} />
            </div>
          </div>
          {/* Left: relative index 3 */}
          <div className="mahjong-zone-left">
            <div className="mahjong-rotated-90">
              <PlayerHud player={seatPlayers[3]} wind={windOf(3)} isDealer={v.dealer === 3} isCurrent={v.cur === 3} tileCount={v.handCounts?.[3] ?? 13} />
              <div className="mahjong-hand-row">
                <HandTiles pid={3} hand={Array(v.handCounts?.[3] ?? 13).fill(null)} />
                <MeldDisplay pid={3} melds={v.melds[3]} />
              </div>
            </div>
          </div>
          {/* Center */}
          <div className="mahjong-zone-center">
            <div className="mahjong-center-box">
              <DiscardZone pid={2} discs={v.discs[2]} lastDiscPid={v.lastDpid} pos="top" />
              <DiscardZone pid={3} discs={v.discs[3]} lastDiscPid={v.lastDpid} pos="left" />
              <div className="mahjong-center-info">
                <div className="mahjong-round-badge">
                  <div className="text-base font-semibold" style={{ color: "var(--mahjong-gold)" }}>{roundWind()}</div>
                  <div className="text-[10px] mt-1" style={{ color: "#888" }}>剩余 {v.tilesLeft} 张</div>
                </div>
              </div>
              <DiscardZone pid={1} discs={v.discs[1]} lastDiscPid={v.lastDpid} pos="right" />
              <DiscardZone pid={0} discs={v.discs[0]} lastDiscPid={v.lastDpid} pos="bottom" />
            </div>
          </div>
          {/* Right: relative index 1 */}
          <div className="mahjong-zone-right">
            <div className="mahjong-rotated-neg90">
              <PlayerHud player={seatPlayers[1]} wind={windOf(1)} isDealer={v.dealer === 1} isCurrent={v.cur === 1} tileCount={v.handCounts?.[1] ?? 13} />
              <div className="mahjong-hand-row">
                <HandTiles pid={1} hand={Array(v.handCounts?.[1] ?? 13).fill(null)} />
                <MeldDisplay pid={1} melds={v.melds[1]} />
              </div>
            </div>
          </div>
          {/* Bottom: me (relative index 0) */}
          <div className="mahjong-zone-bottom">
            <PlayerHud player={seatPlayers[0]} wind={windOf(0)} isDealer={v.dealer === 0} isCurrent={v.cur === 0} />
            <div className="mahjong-hand-row">
              <MeldDisplay pid={0} melds={v.melds[0]} />
              <HumanHand hand={v.hand} selIdx={mpSelIdx} onClick={mpHandleTileClick} />
            </div>
          </div>
        </div>

        {/* MP Action Bar */}
        {v.myActions && v.myActions.length > 0 && (
          <div className="mahjong-action-bar">
            {v.myActions.map((a) => (
              <button key={a} className={`mahjong-ab mahjong-ab-${a === "gang_self" ? "gang" : a === "chi_choose" ? "chi" : a}`} onClick={() => mpHandleAction(a)}>
                {{ hu: "胡", peng: "碰", chi: "吃", chi_choose: "选择吃牌", gang: "杠", gang_self: "杠", pass: "过", discard: "出牌" }[a] || a}
              </button>
            ))}
          </div>
        )}

        {/* MP Chi Options */}
        {v.chiOpts && v.chiOpts.length > 0 && (
          <div className="mahjong-chi-panel">
            <div className="text-[11px] mb-2 tracking-wider" style={{ color: "#888" }}>选择吃牌方式</div>
            <div className="flex gap-3">
              {v.chiOpts.map((seq, si) => (
                <div key={si} className="mahjong-chi-opt" onClick={() => mpHandleChiChoose(si)}>
                  {seq.map((t, ti) => <TileComponent key={ti} tile={t} size="small" />)}
                </div>
              ))}
            </div>
          </div>
        )}

        {mpNotif && <div className="mahjong-notif">{mpNotif}</div>}

        {/* MP Result */}
        {v.result && (
          <ResultOverlay
            players={seatPlayers}
            result={v.result}
            cfg={v.cfg}
            isLocal={false}
            onNext={mpIsHost ? mpNextRound : undefined}
            onBack={backLobby}
          />
        )}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </div>
    );
  }

  // fallback
  return null;
}

// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?//  SHARED SUB COMPONENTS
// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?
function RowInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--app-muted)" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-32 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm text-[var(--app-fg)] text-center outline-none focus:border-[var(--mahjong-gold)]"
      />
    </div>
  );
}

function PlayerHud({ player, wind, isDealer, isCurrent, tileCount }: { player: Player; wind: string; isDealer: boolean; isCurrent: boolean; tileCount?: number }) {
  if (!player) return null;
  return (
    <div className="mahjong-hud">
      <div className={`mahjong-hud-dot ${isCurrent ? "on" : ""}`} />
      <span className="mahjong-hud-name">{player.name}</span>
      <span className="mahjong-hud-wind">{wind}</span>
      <span className="mahjong-hud-score">{player.score}分</span>
      {tileCount !== undefined && <span className="mahjong-hud-tiles">{tileCount}张</span>}
      {isDealer && <span className="mahjong-hud-dealer">庄</span>}
    </div>
  );
}

function HandTiles({ pid, hand }: { pid: number; hand: (Tile | null)[] }) {
  const sizeClass = pid === 2 ? "sm" : "xs";
  return (
    <div className={`mahjong-hand mahjong-hand-${sizeClass}`}>
      {hand.map((_, i) => <TileComponent key={i} tile={null} size={pid === 2 ? "small" : "tiny"} />)}
    </div>
  );
}

function HumanHand({ hand, selIdx, onClick }: { hand: Tile[]; selIdx: number; onClick: (idx: number) => void }) {
  return (
    <div className="mahjong-hand">
      {hand.map((t, i) => (
        <div key={i} className={`mahjong-tile-wrap ${selIdx === i ? "sel" : ""}`} onClick={() => onClick(i)}>
          <TileComponent tile={t} size="normal" />
        </div>
      ))}
    </div>
  );
}

function MeldDisplay({ pid, melds }: { pid: number; melds: Meld[] }) {
  if (!melds || melds.length === 0) return null;
  const size = pid === 0 || pid === 2 ? "small" : "tiny";
  return (
    <div className="mahjong-melds">
      {melds.map((m, mi) => (
        <div key={mi} className="mahjong-meld-group">
          {m.tiles.map((t, ti) => {
            const hidden = m.type === "gang_hidden" && pid !== 0;
            return <TileComponent key={ti} tile={hidden ? null : t} size={size} />;
          })}
        </div>
      ))}
    </div>
  );
}

function DiscardZone({ pid, discs, lastDiscPid, pos }: { pid: number; discs: Tile[]; lastDiscPid: number; pos: "top" | "left" | "right" | "bottom" }) {
  return (
    <div className={`mahjong-disc-zone mahjong-disc-${pos}`}>
      {discs.map((t, i) => {
        const isLast = i === discs.length - 1 && pid === lastDiscPid;
        return <TileComponent key={i} tile={t} size="discard" className={isLast ? "last-discard" : ""} />;
      })}
    </div>
  );
}

type PipCell = { row: number; col: number };

const PIP_LAYOUTS: Record<number, PipCell[]> = {
  1: [{ row: 2, col: 2 }],
  2: [{ row: 1, col: 1 }, { row: 3, col: 3 }],
  3: [{ row: 1, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 3 }],
  4: [{ row: 1, col: 1 }, { row: 1, col: 3 }, { row: 3, col: 1 }, { row: 3, col: 3 }],
  5: [
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 2, col: 2 },
    { row: 3, col: 1 },
    { row: 3, col: 3 },
  ],
  6: [
    { row: 1, col: 1 },
    { row: 2, col: 1 },
    { row: 3, col: 1 },
    { row: 1, col: 3 },
    { row: 2, col: 3 },
    { row: 3, col: 3 },
  ],
  7: [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 1, col: 3 },
    { row: 2, col: 2 },
    { row: 3, col: 1 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
  ],
  8: [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 1, col: 3 },
    { row: 2, col: 1 },
    { row: 2, col: 3 },
    { row: 3, col: 1 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
  ],
  9: [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 1, col: 3 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 2, col: 3 },
    { row: 3, col: 1 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
  ],
};

function getPipLayout(n: number): PipCell[] {
  return PIP_LAYOUTS[n] ?? PIP_LAYOUTS[1];
}

function ResultOverlay({ players, result, cfg, isLocal, onNext, onBack }: {
  players: Player[];
  result: { winner: number; fan: FanResult; delta: number[]; isSelf: boolean; isDraw: boolean };
  cfg: GameConfig;
  isLocal: boolean;
  onNext?: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mahjong-overlay">
      <div className="mahjong-result-panel">
        <div className="text-4xl font-bold" style={{ color: "var(--mahjong-gold)" }}>
          {result.isDraw ? "流局" : result.isSelf ? "自摸" : "胡牌"}
        </div>
        {!result.isDraw && (
          <>
            <div className="text-lg mt-2" style={{ color: "var(--app-muted)" }}>{players[result.winner]?.name ?? "未知玩家"}</div>
            <div className="mt-4 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(0,0,0,.3)", border: "1px solid var(--mahjong-gold-dim)", color: "var(--mahjong-gold)" }}>
              {result.fan.desc} · {result.fan.total}番
            </div>
          </>
        )}
        <div className="grid grid-cols-2 gap-3 mt-6 w-full">
          {players.map((p, i) => {
            const d = result.delta[i];
            return (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,.3)", border: "1px solid var(--app-border)" }}>
                <div className="text-[10px] mb-1" style={{ color: "var(--app-muted)" }}>{p.name}</div>
                <div className={`text-xl font-bold ${d >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {d >= 0 ? "+" : ""}{d}
                </div>
                <div className="text-[10px] mt-1" style={{ color: "var(--app-muted)" }}>{p.score}分</div>
              </div>
            );
          })}
        </div>
        {!result.isDraw && (() => {
          const losers = players.filter((p) => p.score <= cfg.pthr);
          if (losers.length && cfg.punish) return (
            <div className="mt-4 px-4 py-2 rounded-lg text-sm text-red-300" style={{ background: "rgba(200,54,42,.12)", border: "1px solid #882222" }}>
              {losers.map((p) => p.name).join("、")} 触底：{cfg.punish}
            </div>
          );
          return null;
        })()}
        <div className="flex gap-3 mt-6 w-full">
          {onNext && (
            <button onClick={onNext} className="flex-1 rounded-xl bg-[var(--app-fg)] px-6 py-3 text-sm font-semibold text-[var(--app-bg)] tracking-wider">
              下一局
            </button>
          )}
          <button onClick={onBack} className={`${onNext ? "" : "w-full "}rounded-xl border border-[var(--app-border)] px-6 py-3 text-sm text-[var(--app-muted)] tracking-wider hover:text-[var(--app-fg)]`}>
            {isLocal ? "返回" : "返回大厅"}
          </button>
        </div>
      </div>
    </div>
  );
}
function TileComponent({ tile, size = "normal", className = "" }: { tile: Tile | null; size?: "normal" | "small" | "tiny" | "discard"; className?: string }) {
  const sizeStyles: Record<string, React.CSSProperties> = {
    normal: { "--tw": "56px", "--th": "74px", "--td": "5px" } as React.CSSProperties,
    small: { "--tw": "40px", "--th": "54px", "--td": "4px" } as React.CSSProperties,
    tiny: { "--tw": "32px", "--th": "44px", "--td": "3px" } as React.CSSProperties,
    discard: { "--tw": "28px", "--th": "38px", "--td": "2px" } as React.CSSProperties,
  };

  if (!tile) {
    return (
      <div className={`mahjong-tile mahjong-tile-back ${className}`} style={sizeStyles[size]}>
        <div className="mahjong-tile-face" />
      </div>
    );
  }

  const isJoker = tile.id === "P";
  const pipLayout = getPipLayout(tile.n);

  return (
    <div className={`mahjong-tile ${isJoker ? "mahjong-tile-joker" : ""} ${className}`} style={sizeStyles[size]}>
      <div className="mahjong-tile-face">
        {isJoker && <div className="mahjong-joker-tag">白</div>}
        <div className="mahjong-tile-graphic">
          {tile.suit === "w" && (
            <>
              <span className="mahjong-wan-num">{WAN_NAMES[tile.n]}</span>
              <span className="mahjong-wan-kanji">万</span>
            </>
          )}
          {tile.suit === "t" && (
            tile.n === 1
              ? <span className="mahjong-bird">鸟</span>
              : <div className="mahjong-pattern-grid mahjong-tiao-wrap">{pipLayout.map((cell, i) => <div key={i} className={`mahjong-stick ${tile.n === 5 && i === 2 ? "mahjong-stick-red" : ""}`} style={{ gridRow: cell.row, gridColumn: cell.col }} />)}</div>
          )}
          {tile.suit === "b" && (
            <div className="mahjong-pattern-grid mahjong-tong-wrap">
              {pipLayout.map((cell, i) => <div key={i} className={`mahjong-dot ${tile.n === 5 && i === 2 ? "mahjong-dot-center" : ""}`} style={{ gridRow: cell.row, gridColumn: cell.col }} />)}
            </div>
          )}
          {tile.suit === "h" && (
            <>
              <span className={`mahjong-honor-char mahjong-h-${tile.id}`}>{HONOR_NAMES[tile.id]}</span>
              {isJoker && <div className="mahjong-joker-sub">百搭</div>}
            </>
          )}
        </div>
        </div>
      </div>
  );
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="mahjong-overlay" onClick={onClose}>
      <div className="mahjong-rules-panel" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-5 text-[#f3ead7] hover:text-[var(--mahjong-gold)] text-xl cursor-pointer">X</button>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--mahjong-gold)" }}>湖州麻将规则</h2>
        <h3 className="text-xs uppercase tracking-wider mt-4 mb-2 pl-2 border-l-2" style={{ color: "#aed68a", borderColor: "var(--mahjong-gold-dim)" }}>牌型组成</h3>
        <p className="text-xs leading-6" style={{ color: "#f3ead7" }}>136张：万子（红）1-9 · 条子（绿）1-9 · 筒子（蓝）1-9 · 风牌东南西北 · 箭牌中发白</p>
        <h3 className="text-xs uppercase tracking-wider mt-4 mb-2 pl-2 border-l-2" style={{ color: "#aed68a", borderColor: "var(--mahjong-gold-dim)" }}>操作</h3>
        <ul className="text-xs leading-6 list-disc pl-4" style={{ color: "#f3ead7" }}>
          <li><b>吃：</b>只能吃上家打出的牌，组成顺子。</li>
          <li><b>碰：</b>任何人打出，手中有两张相同即可碰。</li>
          <li><b>杠：</b>明杠（他人打出，手中有3张）· 暗杠（自摸4张）· 杠后补摸一张。</li>
          <li><b>白板</b>为万能牌，可以代替任意一张；持有白板只能自摸胡。</li>
        </ul>
        <h3 className="text-xs uppercase tracking-wider mt-4 mb-2 pl-2 border-l-2" style={{ color: "#aed68a", borderColor: "var(--mahjong-gold-dim)" }}>胡牌</h3>
        <p className="text-xs leading-6" style={{ color: "#f3ead7" }}>4组顺子/刻子 + 1对将。基础1番。自摸×2。</p>
        <h3 className="text-xs uppercase tracking-wider mt-4 mb-2 pl-2 border-l-2" style={{ color: "#aed68a", borderColor: "var(--mahjong-gold-dim)" }}>番型</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {["清一色 +6番", "混一色 +3番", "七对 +4番", "豪华七对 +8番", "对对胡 +4番", "暗杠 +2番/次", "明杠 +1番/次", "自摸 ×2"].map((f) => (
            <span key={f} className="px-2 py-1 rounded text-[11px]" style={{ background: "rgba(212,168,67,.1)", border: "1px solid var(--mahjong-gold-dim)", color: "var(--mahjong-gold)" }}>{f}</span>
          ))}
        </div>
        <h3 className="text-xs uppercase tracking-wider mt-4 mb-2 pl-2 border-l-2" style={{ color: "#aed68a", borderColor: "var(--mahjong-gold-dim)" }}>计分</h3>
        <p className="text-xs leading-6" style={{ color: "#f3ead7" }}>番数 × 底分 = 积分变动。点炮：放炮者独赔。自摸：三家各赔。流局不计分。</p>
      </div>
    </div>
  );
}

