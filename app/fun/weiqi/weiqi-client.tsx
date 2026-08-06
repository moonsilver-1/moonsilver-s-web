"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Stone,
  type Board,
  type ScoreResult,
  createBoard,
  boardKey,
  play,
  autoMarkDeadStones,
  score,
  DEFAULT_KOMI,
  starPoints,
} from "./go-engine";

/* ═══════════════════════════════════════════════════
   围棋 · 客户端
   ═══════════════════════════════════════════════════ */

// ── AUDIO ──────────────────────────────────────────
const audioCtxRef = { current: null as AudioContext | null };
let sfxOn = true;

function getAC() {
  if (!audioCtxRef.current)
    audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioCtxRef.current;
}

function tone(f: number, t: OscillatorType = "sine", d = 0.08, v = 0.13, delay = 0) {
  if (!sfxOn) return;
  try {
    const ac = getAC();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g);
    g.connect(ac.destination);
    o.type = t;
    o.frequency.setValueAtTime(f, ac.currentTime + delay);
    g.gain.setValueAtTime(v, ac.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + d);
    o.start(ac.currentTime + delay);
    o.stop(ac.currentTime + delay + d + 0.01);
  } catch {
    /* ignore */
  }
}

const SFX = {
  stone() {
    // 落子「嗒」：短促木质音
    tone(320, "triangle", 0.05, 0.22);
    tone(180, "sine", 0.09, 0.18, 0.005);
  },
  capture() {
    tone(520, "square", 0.05, 0.16);
    tone(380, "square", 0.05, 0.14, 0.05);
  },
  pass() { tone(420, "sine", 0.18, 0.12); },
  click() { tone(760, "square", 0.03, 0.06); },
  err() { tone(160, "sawtooth", 0.18, 0.1); },
  end() {
    [523, 659, 784].forEach((f, i) => tone(f, "sine", 0.22, 0.18, i * 0.14));
  },
};

// ── 常量 ────────────────────────────────────────────
const MP_SESSION_KEY = "weiqi_mp_session";
const PLAYER_NAME_KEY = "weiqi_player_name";
const CLIENT_ID_KEY = "weiqi_mp_client_id";

type MPRoomPlayer = { id: string; name: string; color: Stone | null; online: boolean };
type MPSession = { code: string; playerId: string; isHost: boolean };

type MPView = {
  phase: string;
  board: Board;
  turn: Stone;
  lastMove: { x: number; y: number; color: Stone; pass: boolean } | null;
  captured: { B: number; W: number };
  moves: Array<{ x: number; y: number; color: Stone; pass: boolean }>;
  deadSet: string[];
  deadConfirmed: { B: boolean; W: boolean };
  undoRequest: { by: Stone; pending: boolean } | null;
  result: ScoreResult | null;
  resignedBy: Stone | null;
  myColor: Stone | null;
  players: { name: string; color: Stone | null; online: boolean }[];
  cfg: { size: number; komi: number };
  seq: number;
};

interface LocalGame {
  board: Board;
  turn: Stone;
  history: string[];
  moves: Array<{ x: number; y: number; color: Stone; pass: boolean }>;
  passes: number;
  captured: { B: number; W: number };
  lastMove: { x: number; y: number; color: Stone; pass: boolean } | null;
  phase: "play" | "deadmark" | "ended";
  deadSet: string[];
  deadConfirmed: { B: boolean; W: boolean };
  result: ScoreResult | null;
  resignedBy: Stone | null;
}

function newLocalGame(size: number): LocalGame {
  const b = createBoard(size);
  return {
    board: b,
    turn: "B",
    history: [boardKey(b)],
    moves: [],
    passes: 0,
    captured: { B: 0, W: 0 },
    lastMove: null,
    phase: "play",
    deadSet: [],
    deadConfirmed: { B: false, W: false },
    result: null,
    resignedBy: null,
  };
}

// ── localStorage 辅助 ──────────────────────────────
function getClientId() {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 12);
    window.localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function readStoredPlayerName() {
  if (typeof window === "undefined") return "玩家";
  const s = window.localStorage.getItem(PLAYER_NAME_KEY);
  return s && s.trim() ? s.trim() : "玩家";
}

function persistPlayerName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAYER_NAME_KEY, name.trim() || "玩家");
}

function readMPSession(): MPSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MP_SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<MPSession>;
    if (!p?.code || !p?.playerId) return null;
    return { code: p.code, playerId: p.playerId, isHost: Boolean(p.isHost) };
  } catch {
    return null;
  }
}

function writeMPSession(s: MPSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MP_SESSION_KEY, JSON.stringify(s));
}

function clearMPSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MP_SESSION_KEY);
}

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */
export default function WeiqiClient() {
  const [screen, setScreen] = useState<"lobby" | "local-game" | "mp-waiting" | "mp-game">("lobby");
  const [lobbyMode, setLobbyMode] = useState<"choose" | "local" | "mp">("choose");
  const [playerName, setPlayerName] = useState(readStoredPlayerName);

  // ── 本地 ──
  const [size, setSize] = useState(19);
  const [game, setGame] = useState<LocalGame | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  // ── 联机 ──
  const [mpCode, setMpCode] = useState("");
  const [mpPlayerId, setMpPlayerId] = useState("");
  const [mpPlayers, setMpPlayers] = useState<MPRoomPlayer[]>([]);
  const [mpIsHost, setMpIsHost] = useState(false);
  const [mpView, setMpView] = useState<MPView | null>(null);
  const [mpJoinCode, setMpJoinCode] = useState("");
  const [mpError, setMpError] = useState("");
  const [mpSize, setMpSize] = useState(19);
  const mpPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mpHover, setMpHover] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    persistPlayerName(playerName);
  }, [playerName]);

  // ── 本地逻辑 ──────────────────────────────────────
  function startLocal(s: number) {
    SFX.click();
    setSize(s);
    setGame(newLocalGame(s));
    setScreen("local-game");
  }

  function localPlay(x: number, y: number) {
    if (!game || game.phase !== "play") return;
    const r = play(game.board, x, y, game.turn, new Set(game.history));
    if (!r.ok) { SFX.err(); return; }
    SFX.stone();
    if (r.captured.length) setTimeout(() => SFX.capture(), 60);
    const next: LocalGame = {
      ...game,
      board: r.board,
      history: [...game.history, boardKey(r.board)],
      moves: [...game.moves, { x, y, color: game.turn, pass: false }],
      passes: 0,
      captured: { ...game.captured, [game.turn]: game.captured[game.turn] + r.captured.length },
      lastMove: { x, y, color: game.turn, pass: false },
      deadConfirmed: { B: false, W: false },
      turn: game.turn === "B" ? "W" : "B",
    };
    setGame(next);
  }

  function localPass() {
    if (!game || game.phase !== "play") return;
    SFX.pass();
    const opp = game.turn === "B" ? "W" : "B";
    const passes = game.passes + 1;
    const next: LocalGame = {
      ...game,
      moves: [...game.moves, { x: -1, y: -1, color: game.turn, pass: true }],
      passes,
      lastMove: { x: -1, y: -1, color: game.turn, pass: true },
      turn: opp,
    };
    if (passes >= 2) {
      next.phase = "deadmark";
      next.deadConfirmed = { B: false, W: false };
      next.deadSet = Array.from(autoMarkDeadStones(next.board));
    }
    setGame(next);
  }

  function localResign() {
    if (!game || game.phase === "ended") return;
    const opp = game.turn === "B" ? "W" : "B";
    SFX.end();
    setGame({
      ...game,
      phase: "ended",
      resignedBy: game.turn,
      result: {
        black: 0, white: 0, komi: DEFAULT_KOMI[size],
        winner: opp, diff: 0, blackStones: 0, whiteStones: 0,
        blackTerritory: 0, whiteTerritory: 0, deadCount: 0,
      },
    });
  }

  function localToggleDead(x: number, y: number) {
    if (!game || game.phase !== "deadmark") return;
    const set = new Set(game.deadSet);
    const k = `${x},${y}`;
    if (set.has(k)) set.delete(k);
    else set.add(k);
    setGame({ ...game, deadSet: Array.from(set), deadConfirmed: { B: false, W: false } });
  }

  function localConfirmDead(who: Stone) {
    if (!game || game.phase !== "deadmark") return;
    const confirmed = { ...game.deadConfirmed, [who]: true };
    if (confirmed.B && confirmed.W) {
      SFX.end();
      setGame({
        ...game,
        deadConfirmed: confirmed,
        result: score(game.board, new Set(game.deadSet), DEFAULT_KOMI[size]),
        phase: "ended",
      });
    } else {
      setGame({ ...game, deadConfirmed: confirmed });
    }
  }

  function localResumePlay() {
    if (!game) return;
    SFX.click();
    setGame({
      ...game,
      phase: "play",
      deadSet: [],
      deadConfirmed: { B: false, W: false },
      passes: 0,
      result: null,
    });
  }

  // ── 联机逻辑 ──────────────────────────────────────
  async function enterMpRoom(code: string, playerId: string, isHost: boolean, players: MPRoomPlayer[], view: MPView | null = null) {
    setMpCode(code);
    setMpPlayerId(playerId);
    setMpIsHost(isHost);
    setMpPlayers(players);
    setMpJoinCode(code);
    writeMPSession({ code, playerId, isHost });
    const cur = players.find((p) => p.id === playerId);
    if (cur?.name) setPlayerName(cur.name);
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
    try {
      const res = await fetch("/api/weiqi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume", code: session.code, playerId: session.playerId, clientId: getClientId() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; playerId?: string; isHost?: boolean; players?: MPRoomPlayer[]; view?: MPView }
        | null;
      if (!data?.ok || !data.playerId || !data.players) {
        clearMPSession();
        setScreen("lobby");
        return false;
      }
      await enterMpRoom(session.code, data.playerId, Boolean(data.isHost), data.players, data.view ?? null);
      return true;
    } catch {
      clearMPSession();
      setScreen("lobby");
      return false;
    }
  }

  async function mpCreate() {
    setMpError("");
    SFX.click();
    const name = playerName.trim() || "玩家";
    const res = await fetch("/api/weiqi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", clientId: getClientId(), name, size: mpSize, komi: DEFAULT_KOMI[mpSize] }),
    });
    const data = await res.json();
    if (!data.ok) { setMpError(data.error || "创建失败"); return; }
    await enterMpRoom(data.code, data.playerId, true, data.players);
  }

  async function mpJoin() {
    if (!mpJoinCode.trim()) { setMpError("请输入房间号"); return; }
    setMpError("");
    SFX.click();
    const name = playerName.trim() || "玩家";
    const res = await fetch("/api/weiqi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", clientId: getClientId(), code: mpJoinCode.trim(), name }),
    });
    const data = await res.json();
    if (!data.ok) { setMpError(data.error || "加入失败"); return; }
    await enterMpRoom(mpJoinCode.trim(), data.playerId, false, data.players);
  }

  async function mpRename() {
    if (!mpCode || !mpPlayerId) return;
    const name = playerName.trim() || "玩家";
    setMpError("");
    const res = await fetch("/api/weiqi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", code: mpCode, playerId: mpPlayerId, clientId: getClientId(), name }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; players?: MPRoomPlayer[] } | null;
    if (!res.ok || !data?.ok || !data.players) { setMpError(data?.error || "昵称修改失败"); return; }
    setMpPlayers(data.players);
    setPlayerName(name);
  }

  async function mpStart() {
    SFX.click();
    const res = await fetch("/api/weiqi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", code: mpCode, playerId: mpPlayerId }),
    });
    const data = await res.json();
    if (!data.ok) setMpError(data.error || "开始失败");
  }

  async function mpSend(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/weiqi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, code: mpCode, playerId: mpPlayerId, ...extra }),
    });
    const data = await res.json();
    if (data.ok && data.view) {
      setMpView(data.view);
      setMpHover(null);
    } else if (!data.ok && data.error) {
      SFX.err();
      setMpError(data.error);
      setTimeout(() => setMpError(""), 2000);
    }
  }

  function startMPPoll(code: string, playerId: string) {
    stopMPPoll();
    mpPollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/weiqi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "poll", code, playerId }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; view?: MPView; phase?: string; players?: MPRoomPlayer[] } | null;
        if (!data?.ok) {
          if (res.status === 403 || res.status === 404) {
            stopMPPoll();
            clearMPSession();
            resetMp();
            setScreen("lobby");
          }
          return;
        }
        if (data.phase === "waiting" && data.players) {
          setMpPlayers(data.players);
          setScreen("mp-waiting");
          return;
        }
        if (data.view) setMpView(data.view);
      } catch {
        /* ignore */
      }
    }, 900);
  }

  function stopMPPoll() {
    if (mpPollRef.current) {
      clearInterval(mpPollRef.current);
      mpPollRef.current = null;
    }
  }

  function resetMp() {
    setMpView(null);
    setMpPlayers([]);
    setMpCode("");
    setMpPlayerId("");
    setMpIsHost(false);
    setMpJoinCode("");
  }

  async function backLobby() {
    stopMPPoll();
    if ((screen === "mp-waiting" || screen === "mp-game") && mpCode && mpPlayerId) {
      try {
        await fetch("/api/weiqi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "leave", code: mpCode, playerId: mpPlayerId, clientId: getClientId() }),
        });
      } catch {
        /* ignore */
      }
    }
    clearMPSession();
    resetMp();
    setGame(null);
    setLobbyMode("choose");
    setScreen("lobby");
    setMpError("");
  }

  useEffect(() => () => stopMPPoll(), []);

  useEffect(() => {
    const session = readMPSession();
    if (!session) return;
    // resumeMpRoom 的 setState 发生在异步 fetch 之后，非同步级联；此处为挂载时恢复联机会话
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void resumeMpRoom(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 悔棋请求提示 ──
  // ── 悔棋请求提示：用 ref 记录「已响应过的请求标识」，避免 effect 重置 state ──
  const undoRespondedRef = useRef<string | null>(null);
  const undoVisible = useMemo(() => {
    const u = mpView?.undoRequest;
    if (!u?.pending || u.by === mpView?.myColor) return false;
    // 若该请求已被本端响应（同色），且未变化，则隐藏
    if (undoRespondedRef.current === `${u.by}`) return false;
    return true;
  }, [mpView?.undoRequest, mpView?.myColor]);

  /* ═══ LOBBY ═══ */
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
          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">围棋</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
            黑白对弈 · 提子 · 中国规则数子。支持本地双人与在线房间，双方过手后自动标记死子，可手动修正或继续对弈。
          </p>

          {lobbyMode === "choose" && (
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setLobbyMode("local")}
                className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 text-left backdrop-blur-sm transition-transform hover:scale-[1.01]"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">本地</div>
                <div className="mt-3 text-2xl font-bold">双人面对面</div>
                <div className="mt-3 text-sm leading-6 text-[var(--app-muted)]">一台设备黑白交替落子。</div>
              </button>
              <button
                onClick={() => setLobbyMode("mp")}
                className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 text-left backdrop-blur-sm transition-transform hover:scale-[1.01]"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">联机</div>
                <div className="mt-3 text-2xl font-bold">在线房间</div>
                <div className="mt-3 text-sm leading-6 text-[var(--app-muted)]">创建或加入房间，远程对弈。</div>
              </button>
            </div>
          )}

          {lobbyMode === "local" && (
            <div className="mt-10 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between gap-3 border-b border-[var(--app-border)] pb-4">
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--app-muted)]">本地对弈</h3>
                <button onClick={() => setLobbyMode("choose")} className="text-xs text-[var(--app-muted)] hover:text-[var(--app-fg)]">返回选择</button>
              </div>
              <div className="mb-4">
                <span className="text-sm text-[var(--app-muted)]">棋盘规格</span>
                <div className="mt-3 flex gap-3">
                  {[9, 13, 19].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                        size === s
                          ? "border-[var(--app-fg)] bg-[var(--app-fg)] text-[var(--app-bg)]"
                          : "border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-border-strong)]"
                      }`}
                    >
                      {s} 路
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[var(--app-muted)]">{size} 路 · 贴目 {DEFAULT_KOMI[size]}</p>
              </div>
              <button onClick={() => startLocal(size)} className="mt-4 w-full rounded-xl bg-[var(--app-fg)] px-6 py-3.5 text-sm font-semibold text-[var(--app-bg)] tracking-wider transition-transform hover:scale-[1.01] active:scale-[0.99]">
                开始对弈
              </button>
            </div>
          )}

          {lobbyMode === "mp" && (
            <div className="mt-10 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between gap-3 border-b border-[var(--app-border)] pb-4">
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--app-muted)]">联机对弈</h3>
                <button onClick={() => setLobbyMode("choose")} className="text-xs text-[var(--app-muted)] hover:text-[var(--app-fg)]">返回选择</button>
              </div>
              <div className="space-y-4">
                <RowInput label="你的名字" value={playerName} onChange={setPlayerName} />
                <div>
                  <span className="text-sm text-[var(--app-muted)]">棋盘规格（房主设置）</span>
                  <div className="mt-3 flex gap-3">
                    {[9, 13, 19].map((s) => (
                      <button
                        key={s}
                        onClick={() => setMpSize(s)}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                          mpSize === s
                            ? "border-[var(--app-fg)] bg-[var(--app-fg)] text-[var(--app-bg)]"
                            : "border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-border-strong)]"
                        }`}
                      >
                        {s} 路
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={mpCreate} className="mt-6 w-full rounded-xl bg-[var(--app-fg)] px-6 py-3.5 text-sm font-semibold text-[var(--app-bg)] tracking-wider transition-transform hover:scale-[1.01] active:scale-[0.99]">
                创建房间
              </button>
              <div className="mt-6 flex items-center gap-3">
                <input
                  value={mpJoinCode}
                  onChange={(e) => setMpJoinCode(e.target.value)}
                  placeholder="输入房间号"
                  className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-fg)] text-center outline-none focus:border-[var(--weiqi-accent)]"
                  maxLength={6}
                />
                <button onClick={mpJoin} className="rounded-xl border border-[var(--app-border)] px-6 py-2.5 text-sm font-semibold text-[var(--app-fg)] tracking-wider hover:border-[var(--app-border-strong)]">
                  加入房间
                </button>
              </div>
              {mpError && <p className="mt-3 text-sm text-red-500">{mpError}</p>}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* ═══ MP WAITING ═══ */
  if (screen === "mp-waiting") {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300">
        <section className="mx-auto max-w-2xl px-6 py-16">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">联机</span>
          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">围棋</h1>
          <div className="mt-10 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">房间号</p>
            <p className="mt-2 text-4xl font-bold tracking-[0.3em]" style={{ color: "var(--weiqi-accent)" }}>{mpCode}</p>
            <p className="mt-2 text-xs text-[var(--app-muted)]">把房间号发给朋友就能加入（房主执黑）</p>
          </div>
          <div className="mt-6 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--app-muted)]">房间昵称</h3>
                <p className="mt-1 text-sm text-[var(--app-muted)]">改一个容易认的名字。</p>
              </div>
              <span className="rounded-full border border-[var(--app-border)] px-3 py-1 text-xs text-[var(--app-muted)]">{playerName.trim() || "玩家"}</span>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-sm text-[var(--app-fg)] outline-none focus:border-[var(--weiqi-accent)]"
                placeholder="输入你的昵称"
                maxLength={24}
              />
              <button onClick={mpRename} className="rounded-xl bg-[var(--app-fg)] px-5 py-3 text-sm font-semibold text-[var(--app-bg)] tracking-wider">
                保存昵称
              </button>
            </div>
          </div>
          <div className="mt-6 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 backdrop-blur-sm">
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--app-muted)] mb-4">玩家列表 ({mpPlayers.length}/2)</h3>
            <div className="space-y-2">
              {mpPlayers.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--app-border)] px-4 py-3">
                  <span className="text-sm font-medium">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--weiqi-accent)]" style={{ color: "var(--weiqi-accent)" }}>房主</span>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--app-border)] text-[var(--app-muted)]">{p.online ? "在线" : "离线"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              {mpIsHost ? (
                mpPlayers.length >= 2 ? (
                  <button onClick={mpStart} className="w-full rounded-xl bg-[var(--app-fg)] px-4 py-3 text-sm font-semibold text-[var(--app-bg)] tracking-wider">
                    开始对弈（你执黑）
                  </button>
                ) : (
                  <p className="text-sm text-[var(--app-muted)] text-center">等待对手加入…</p>
                )
              ) : (
                <p className="text-sm text-[var(--app-muted)] text-center">等待房主开始对弈…</p>
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

  /* ═══ LOCAL GAME ═══ */
  if (screen === "local-game" && game) {
    const myTurn = game.phase === "play";
    return (
      <GameShell
        board={game.board}
        size={game.board.length}
        lastMove={game.lastMove}
        turn={game.turn}
        phase={game.phase}
        deadSet={game.deadSet}
        result={game.result}
        resignedBy={game.resignedBy}
        captured={game.captured}
        komi={DEFAULT_KOMI[size]}
        hover={hover}
        onHover={setHover}
        playable={myTurn}
        onPlay={(x, y) => {
          if (game.phase === "deadmark") localToggleDead(x, y);
          else localPlay(x, y);
        }}
        onBack={backLobby}
        onToggleSfx={() => { sfxOn = !sfxOn; SFX.click(); }}
        sfxOn={sfxOn}
        mode="local"
        controls={
          <>
            {game.phase === "play" && (
              <div className="flex gap-2 flex-wrap justify-center">
                <ControlBtn onClick={localPass}>过手 Pass</ControlBtn>
                <ControlBtn onClick={localResign} variant="danger">认输</ControlBtn>
              </div>
            )}
            {game.phase === "deadmark" && (
              <DeadMarkPanel
                size={size}
                onConfirmBlack={() => localConfirmDead("B")}
                onConfirmWhite={() => localConfirmDead("W")}
                onResume={localResumePlay}
                confirmedB={game.deadConfirmed.B}
                confirmedW={game.deadConfirmed.W}
              />
            )}
          </>
        }
        topInfo={
          <TopInfo
            turn={game.turn}
            phase={game.phase}
            passes={game.passes}
            deadConfirmed={game.deadConfirmed}
            resignedBy={game.resignedBy}
            mode="local"
          />
        }
      />
    );
  }

  /* ═══ MP GAME ═══ */
  if (screen === "mp-game" && mpView) {
    const v = mpView;
    const myTurn = v.phase === "play" && v.turn === v.myColor;
    return (
      <GameShell
        board={v.board}
        size={v.cfg.size}
        lastMove={v.lastMove}
        turn={v.turn}
        phase={v.phase}
        deadSet={v.deadSet}
        result={v.result}
        resignedBy={v.resignedBy}
        captured={v.captured}
        komi={v.cfg.komi}
        hover={mpHover}
        onHover={setMpHover}
        playable={myTurn || v.phase === "deadmark"}
        onPlay={(x, y) => {
          if (v.phase === "deadmark") mpSend("markDead", { x, y });
          else if (myTurn) {
            SFX.stone();
            mpSend("act", { x, y });
          }
        }}
        onBack={backLobby}
        onToggleSfx={() => { sfxOn = !sfxOn; SFX.click(); }}
        sfxOn={sfxOn}
        mode="mp"
        controls={
          <>
            {v.phase === "play" && (
              <div className="flex gap-2 flex-wrap justify-center">
                <ControlBtn onClick={() => { SFX.pass(); mpSend("pass"); }} disabled={!myTurn}>过手 Pass</ControlBtn>
                <ControlBtn onClick={() => mpSend("resign")} variant="danger">认输</ControlBtn>
                <ControlBtn onClick={() => mpSend("undoRequest")} disabled={!myTurn}>悔棋</ControlBtn>
              </div>
            )}
            {v.phase === "deadmark" && v.myColor && (
              <DeadMarkPanel
                size={v.cfg.size}
                onConfirmBlack={() => mpSend("confirmDead")}
                onConfirmWhite={() => mpSend("confirmDead")}
                onResume={() => mpSend("resumePlay")}
                confirmedB={v.deadConfirmed.B}
                confirmedW={v.deadConfirmed.W}
                myColor={v.myColor}
              />
            )}
          </>
        }
        topInfo={
          <TopInfo
            turn={v.turn}
            phase={v.phase}
            passes={0}
            deadConfirmed={v.deadConfirmed}
            resignedBy={v.resignedBy}
            mode="mp"
            myColor={v.myColor}
            players={v.players}
          />
        }
        overlay={
          undoVisible && v.undoRequest ? (
            <UndoPrompt
              onAccept={() => { undoRespondedRef.current = `${v.undoRequest!.by}`; mpSend("undoRespond", { accept: true }); }}
              onDecline={() => { undoRespondedRef.current = `${v.undoRequest!.by}`; mpSend("undoRespond", { accept: false }); }}
            />
          ) : null
        }
        error={mpError}
      />
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════
   共用子组件
   ═══════════════════════════════════════════════════ */
function RowInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--app-muted)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm text-[var(--app-fg)] text-center outline-none focus:border-[var(--weiqi-accent)]"
      />
    </div>
  );
}

function ControlBtn({
  children,
  onClick,
  variant = "default",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => { if (!disabled) { SFX.click(); onClick(); } }}
      disabled={disabled}
      className={`weiqi-ctrl ${variant === "danger" ? "weiqi-ctrl-danger" : ""} ${disabled ? "weiqi-ctrl-disabled" : ""}`}
    >
      {children}
    </button>
  );
}

function TopInfo({
  turn,
  phase,
  passes,
  deadConfirmed,
  resignedBy,
  mode,
  myColor,
  players,
}: {
  turn: Stone;
  phase: string;
  passes: number;
  deadConfirmed: { B: boolean; W: boolean };
  resignedBy: Stone | null;
  mode: "local" | "mp";
  myColor?: Stone | null;
  players?: { name: string; color: Stone | null; online: boolean }[];
}) {
  let text = "";
  if (phase === "play") {
    if (mode === "local") {
      text = passes >= 1 ? `${turn === "B" ? "黑" : "白"}方落子（对方已过手，再过手即进入数子）` : `${turn === "B" ? "黑" : "白"}方落子`;
    } else {
      const me = turn === myColor;
      text = me ? "轮到你落子" : `等待对手（${turn === "B" ? "黑" : "白"}）落子…`;
    }
  } else if (phase === "deadmark") {
    const bOk = deadConfirmed.B ? "✓" : "";
    const wOk = deadConfirmed.W ? "✓" : "";
    text = `死子标记阶段 · 黑${bOk} 白${wOk}（双方确认后数子）`;
  } else if (phase === "ended") {
    text = resignedBy ? `${resignedBy === "B" ? "黑" : "白"}方认输` : "对局结束";
  }

  return (
    <div className="weiqi-topinfo">
      <div className="weiqi-turn-dot" style={{ background: turn === "B" ? "var(--weiqi-black)" : "var(--weiqi-white)" }} />
      <span>{text}</span>
      {mode === "mp" && players && (
        <span className="weiqi-topinfo-players">
          黑：{players.find((p) => p.color === "B")?.name ?? "?"}　vs　白：{players.find((p) => p.color === "W")?.name ?? "?"}
        </span>
      )}
    </div>
  );
}

function DeadMarkPanel({
  size,
  onConfirmBlack,
  onConfirmWhite,
  onResume,
  confirmedB,
  confirmedW,
  myColor,
}: {
  size: number;
  onConfirmBlack: () => void;
  onConfirmWhite: () => void;
  onResume: () => void;
  confirmedB: boolean;
  confirmedW: boolean;
  myColor?: Stone;
}) {
  void size;
  // 联机：两人都点「确认死子」即可（任一按钮都触发同一个 confirm 动作）
  return (
    <div className="weiqi-deadmark-panel">
      <p className="weiqi-deadmark-hint">
        点棋盘上的棋子可加标/取消死子（已自动标记）。
        {confirmedB && confirmedW ? " 双方已确认，正在数子…" : " 双方确认后自动数子。"}
      </p>
      <div className="flex gap-2 flex-wrap justify-center mt-3">
        <ControlBtn onClick={onConfirmBlack} variant="default">
          确认死子 {confirmedB ? "✓" : ""}
        </ControlBtn>
        <ControlBtn onClick={onConfirmWhite} variant="default">
          确认死子（白） {confirmedW ? "✓" : ""}
        </ControlBtn>
        <ControlBtn onClick={onResume} variant="danger">继续对弈</ControlBtn>
      </div>
      {myColor && <p className="text-[10px] mt-2 text-[var(--app-muted)]">你执 {myColor === "B" ? "黑" : "白"}</p>}
    </div>
  );
}

function UndoPrompt({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="weiqi-overlay">
      <div className="weiqi-undo-panel">
        <h3 className="text-lg font-bold" style={{ color: "var(--weiqi-accent)" }}>对手请求悔棋</h3>
        <p className="mt-2 text-sm text-[var(--app-muted)]">是否同意回退最后一手？</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onAccept} className="weiqi-ctrl">同意</button>
          <button onClick={onDecline} className="weiqi-ctrl weiqi-ctrl-danger">拒绝</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GameShell —— Canvas 棋盘 + 控制栏
   ═══════════════════════════════════════════════════ */
function GameShell({
  board,
  size,
  lastMove,
  turn,
  phase,
  deadSet,
  result,
  captured,
  komi,
  hover,
  onHover,
  playable,
  onPlay,
  onBack,
  onToggleSfx,
  sfxOn,
  mode,
  controls,
  topInfo,
  overlay,
  error,
  resignedBy,
}: {
  board: Board;
  size: number;
  lastMove: { x: number; y: number; color: Stone; pass: boolean } | null;
  turn: Stone;
  phase: string;
  deadSet: string[];
  result: ScoreResult | null;
  resignedBy: Stone | null;
  captured: { B: number; W: number };
  komi: number;
  hover: { x: number; y: number } | null;
  onHover: (h: { x: number; y: number } | null) => void;
  playable: boolean;
  onPlay: (x: number, y: number) => void;
  onBack: () => void;
  onToggleSfx: () => void;
  sfxOn: boolean;
  mode: "local" | "mp";
  controls: React.ReactNode;
  topInfo: React.ReactNode;
  overlay?: React.ReactNode;
  error?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  // 自适应尺寸
  useEffect(() => {
    function resize() {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const side = Math.min(rect.width, rect.height);
      setDim({ w: side, h: side });
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const deadSetObj = useMemo(() => new Set(deadSet), [deadSet]);
  const stars = useMemo(() => starPoints(size), [size]);

  // 绘制
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || dim.w === 0) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = dim.w * dpr;
    cv.height = dim.h * dpr;
    cv.style.width = `${dim.w}px`;
    cv.style.height = `${dim.h}px`;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBoard(ctx, { board, size, lastMove, deadSet: deadSetObj, stars, hover, phase });
  }, [dim, board, size, lastMove, deadSetObj, stars, hover, phase]);

  function handleMouse(e: React.MouseEvent<HTMLCanvasElement>, click: boolean) {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const { cell, origin, margin } = cellMetrics(dim.w, size);
    const gx = Math.round((px - margin) / cell);
    const gy = Math.round((py - margin) / cell);
    void origin;
    if (gx < 0 || gy < 0 || gx >= size || gy >= size) {
      if (!click) onHover(null);
      return;
    }
    // 命中半径检测
    const cxp = margin + gx * cell;
    const cyp = margin + gy * cell;
    if (Math.hypot(px - cxp, py - cyp) > cell * 0.5) {
      if (!click) onHover(null);
      return;
    }
    if (click) {
      onPlay(gx, gy);
    } else {
      onHover({ x: gx, y: gy });
    }
  }

  const blackName = mode === "mp" ? "" : "黑方";
  const whiteName = mode === "mp" ? "" : "白方";

  return (
    <div className="weiqi-game">
      <div className="weiqi-topbar">
        <button className="weiqi-tb" onClick={onToggleSfx}>{sfxOn ? "🔊" : "🔇"}</button>
        <button className="weiqi-tb" onClick={onBack}>返回</button>
      </div>

      {topInfo}

      <div className="weiqi-main">
        <div className="weiqi-board-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            onMouseMove={(e) => handleMouse(e, false)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => handleMouse(e, true)}
            style={{ cursor: playable ? "pointer" : "default", display: dim.w ? "block" : "none" }}
          />
        </div>

        <aside className="weiqi-side">
          <div className="weiqi-player-card">
            <div className="weiqi-stone-mini" style={{ background: "radial-gradient(circle at 35% 30%, #6a6a6a, #000)" }} />
            <div>
              <div className="weiqi-player-name">{blackName || "黑"}</div>
              <div className="weiqi-player-stat">提子 {captured.B}　{phase === "ended" && result ? `子空 ${result.black}` : ""}</div>
            </div>
            {phase === "play" && turn === "B" && <span className="weiqi-turn-tag">行棋</span>}
          </div>
          <div className="weiqi-player-card">
            <div className="weiqi-stone-mini" style={{ background: "radial-gradient(circle at 35% 30%, #fff, #c8c8c8)" }} />
            <div>
              <div className="weiqi-player-name">{whiteName || "白"}</div>
              <div className="weiqi-player-stat">提子 {captured.W}　贴目 {komi}　{phase === "ended" && result ? `子空 ${result.white}` : ""}</div>
            </div>
            {phase === "play" && turn === "W" && <span className="weiqi-turn-tag">行棋</span>}
          </div>

          <div className="weiqi-controls">{controls}</div>

          {error && <p className="weiqi-err">{error}</p>}
        </aside>
      </div>

      {phase === "ended" && result && <ResultOverlay result={result} resignedBy={resignedBy} onBack={onBack} />}
      {overlay}
    </div>
  );
}

function ResultOverlay({ result, resignedBy, onBack }: { result: ScoreResult; resignedBy: Stone | null; onBack: () => void }) {
  const winText = resignedBy
    ? `${resignedBy === "B" ? "黑" : "白"}方认输 · ${result.winner === "B" ? "黑" : "白"}胜`
    : result.winner === "B" ? "黑胜" : result.winner === "W" ? "白胜" : "和棋";
  return (
    <div className="weiqi-overlay">
      <div className="weiqi-result">
        <div className="text-4xl font-bold" style={{ color: "var(--weiqi-accent)" }}>{winText}</div>
        {!resignedBy && result.diff > 0 && (
          <div className="mt-2 text-sm text-[var(--app-muted)]">领先 {result.diff} 目（含贴目 {result.komi}）</div>
        )}
        <div className="grid grid-cols-2 gap-3 mt-6 w-full">
          <div className="weiqi-result-cell">
            <div className="weiqi-result-label">黑</div>
            <div className="text-2xl font-bold">{result.black}</div>
            <div className="weiqi-result-sub">子{result.blackStones} + 空{result.blackTerritory}</div>
          </div>
          <div className="weiqi-result-cell">
            <div className="weiqi-result-label">白</div>
            <div className="text-2xl font-bold">{result.white}</div>
            <div className="weiqi-result-sub">子{result.whiteStones} + 空{result.whiteTerritory} + 贴{result.komi}</div>
          </div>
        </div>
        <button onClick={onBack} className="weiqi-ctrl mt-6 w-full">返回大厅</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Canvas 绘制
   ═══════════════════════════════════════════════════ */
function cellMetrics(side: number, size: number) {
  const margin = side / (size + 1);
  const cell = (side - margin * 2) / (size - 1);
  return { cell, margin, origin: margin };
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  opts: {
    board: Board;
    size: number;
    lastMove: { x: number; y: number; color: Stone; pass: boolean } | null;
    deadSet: Set<string>;
    stars: Array<[number, number]>;
    hover: { x: number; y: number } | null;
    phase: string;
  },
) {
  const { board, size, lastMove, deadSet, stars, hover, phase } = opts;
  const side = ctx.canvas.width / (window.devicePixelRatio || 1);
  const { cell, margin } = cellMetrics(side, size);

  // 木纹底
  const styles = getComputedStyle(document.documentElement);
  const boardColor = (styles.getPropertyValue("--weiqi-board").trim()) || "#e6b873";
  const lineColor = (styles.getPropertyValue("--weiqi-line").trim()) || "#3a2a14";
  const blackStone = (styles.getPropertyValue("--weiqi-black").trim()) || "#111";
  const whiteStone = (styles.getPropertyValue("--weiqi-white").trim()) || "#f5f5f0";

  ctx.fillStyle = boardColor;
  ctx.fillRect(0, 0, side, side);

  // 网格线
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = Math.max(1, cell * 0.03);
  ctx.beginPath();
  for (let i = 0; i < size; i++) {
    const p = margin + i * cell;
    ctx.moveTo(margin, p);
    ctx.lineTo(margin + cell * (size - 1), p);
    ctx.moveTo(p, margin);
    ctx.lineTo(p, margin + cell * (size - 1));
  }
  ctx.stroke();

  // 星位
  ctx.fillStyle = lineColor;
  const r = Math.max(2, cell * 0.1);
  for (const [sx, sy] of stars) {
    ctx.beginPath();
    ctx.arc(margin + sx * cell, margin + sy * cell, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 坐标
  ctx.fillStyle = lineColor;
  ctx.font = `${Math.max(8, cell * 0.3)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const letters = "ABCDEFGHJKLMNOPQRST"; // 跳过 I
  for (let i = 0; i < size; i++) {
    ctx.fillText(letters[i], margin + i * cell, margin / 2);
    ctx.fillText(String(size - i), margin / 2, margin + i * cell);
  }

  // 棋子
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = board[y][x];
      if (!c) continue;
      const cx = margin + x * cell;
      const cy = margin + y * cell;
      const isDead = deadSet.has(`${x},${y}`);
      drawStone(ctx, cx, cy, cell * 0.46, c === "B" ? blackStone : whiteStone, c === "W");
      if (isDead) {
        // 死子标记：红 ×
        ctx.strokeStyle = "#d33";
        ctx.lineWidth = Math.max(1.5, cell * 0.06);
        const s = cell * 0.28;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy + s);
        ctx.moveTo(cx + s, cy - s);
        ctx.lineTo(cx - s, cy + s);
        ctx.stroke();
      }
    }
  }

  // 上一手标记
  if (lastMove && !lastMove.pass && lastMove.x >= 0) {
    const cx = margin + lastMove.x * cell;
    const cy = margin + lastMove.y * cell;
    ctx.strokeStyle = lastMove.color === "B" ? "#fff" : "#d33";
    ctx.lineWidth = Math.max(1.5, cell * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 悬停预览（仅 play 阶段且空点）
  if (hover && phase === "play") {
    const { x, y } = hover;
    if (x >= 0 && y >= 0 && x < size && y < size && !board[y][x]) {
      ctx.globalAlpha = 0.45;
      drawStone(ctx, margin + x * cell, margin + y * cell, cell * 0.46, board.length ? "#111" : "#000", false);
      ctx.globalAlpha = 1;
    }
  }
}

function drawStone(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string, white: boolean) {
  // 立体高光：径向渐变
  const grad = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.1, cx, cy, radius);
  if (white) {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.6, "#f0efe8");
    grad.addColorStop(1, "#b8b6ac");
  } else {
    grad.addColorStop(0, "#5a5a5a");
    grad.addColorStop(0.5, "#1a1a1a");
    grad.addColorStop(1, "#000000");
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  // 阴影描边
  ctx.strokeStyle = white ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();
  void color;
}
