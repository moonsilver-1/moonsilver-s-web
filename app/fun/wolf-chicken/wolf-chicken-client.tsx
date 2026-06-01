"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type PlayerView,
  type Card,
  type GameState,
  type ActionRequest,
  CHARACTERS,
  CAMP_NAMES,
  CAMP_EMOJIS,
  SUIT_SYMBOLS,
  SUIT_COLORS,
  RANK_NAMES,
  isRedCard,
  initGame,
  assignCharacter,
  autoAssignCharacters,
  startTurn,
  doJudge,
  useCard,
  useSkill,
  submitReact,
  discardToLimit,
  autoDiscard,
  aiAction,
  buildPlayerView,
  handLimit,
  canUseCard,
  canUseSkill,
} from "./game-core";

/* ═══════════════════════════════════════════════════
   狼鸡杀 · 客户端
   ═══════════════════════════════════════════════════ */

// ── SFX ────────────────────────────────────────────

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
  bite() { tone(200, "sawtooth", 0.12, 0.14); tone(150, "sawtooth", 0.08, 0.1, 0.1); },
  dodge() { tone(660, "sine", 0.06, 0.12); tone(880, "sine", 0.05, 0.1, 0.06); },
  skill() { [520, 650, 780].forEach((f, i) => tone(f, "square", 0.06, 0.14, i * 0.06)); },
  damage() { tone(180, "sawtooth", 0.18, 0.15); tone(120, "sawtooth", 0.12, 0.12, 0.1); },
  win() { [523, 659, 784, 1047].forEach((f, i) => { tone(f, "sine", 0.22, 0.2, i * 0.14); tone(f * 0.5, "square", 0.16, 0.1, i * 0.14); }); },
  click() { tone(800, "square", 0.03, 0.06); },
  err() { tone(180, "sawtooth", 0.18, 0.12); },
};

// ── Storage ────────────────────────────────────────

const PLAYER_NAME_KEY = "wolfchicken_player_name";
const MP_SESSION_KEY = "wolfchicken_mp_session";

function readStoredPlayerName() {
  if (typeof window === "undefined") return "玩家";
  return window.localStorage.getItem(PLAYER_NAME_KEY) || "玩家";
}
function writeStoredPlayerName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAYER_NAME_KEY, name);
}

function getMpClientId() {
  if (typeof window === "undefined") return "server";
  const key = "wolfchicken_mp_client_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2, 12);
    window.localStorage.setItem(key, id);
  }
  return id;
}

function readMPSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MP_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code: string; playerId: string; isHost: boolean };
    if (!parsed?.code || !parsed?.playerId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeMPSession(session: { code: string; playerId: string; isHost: boolean }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MP_SESSION_KEY, JSON.stringify(session));
}

function clearMPSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MP_SESSION_KEY);
}

// ── Types ──────────────────────────────────────────

type Screen = "lobby" | "local-game" | "mp-waiting" | "mp-game";
type LobbyMode = "choose" | "local" | "mp";

type MPRoomPlayer = { id: string; name: string; isAI: boolean };
type MPSession = { code: string; playerId: string; isHost: boolean };

// ── Component ──────────────────────────────────────

export default function WolfChickenClient() {
  // screen: lobby | local-game | mp-waiting | mp-game
  const [screen, setScreen] = useState<Screen>("lobby");
  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("choose");
  const [playerName, setPlayerName] = useState(readStoredPlayerName);

  // local game
  const localGameRef = useRef<GameState | null>(null);
  const [localView, setLocalView] = useState<PlayerView | null>(null);
  const localSeqRef = useRef(0);

  // multiplayer
  const [mpCode, setMpCode] = useState("");
  const [mpPlayerId, setMpPlayerId] = useState("");
  const [mpIsHost, setMpIsHost] = useState(false);
  const [mpPlayers, setMpPlayers] = useState<MPRoomPlayer[]>([]);
  const [mpView, setMpView] = useState<PlayerView | null>(null);
  const [mpJoinCode, setMpJoinCode] = useState("");
  const [mpError, setMpError] = useState("");
  const mpPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mpSeq, setMpSeq] = useState(0);

  // UI states
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Animation states
  const prevViewRef = useRef<PlayerView | null>(null);
  const [damageAnims, setDamageAnims] = useState<{ id: number; text: string; x: number; y: number; color: string }[]>([]);
  const [turnNotice, setTurnNotice] = useState<string | null>(null);
  const [discardCardIds, setDiscardCardIds] = useState<string[]>([]);
  const dmgIdRef = useRef(0);

  // ── Helpers ──────────────────────────────────────

  const logIt = useCallback((msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 30));
  }, []);

  // ── Local Game ───────────────────────────────────

  function startLocalGame() {
    SFX.click();
    const names = [playerName.trim() || "玩家", "AI·小狼", "AI·小鸡", "AI·坚果", "AI·主播", "AI·码农", "AI·波风", "AI·黄鼠狼"];
    const g = initGame(names);
    localGameRef.current = g;
    localSeqRef.current = 0;
    setScreen("local-game");
    setLocalView(buildPlayerView(g, 0, 0));
    setSelectedCardId(null);
    setSelectedSkillId(null);
    setSelectedTargets([]);
    setShowResult(false);
    setLogs([]);
  }

  function handleLocalAction(action: ActionRequest) {
    const g = localGameRef.current;
    if (!g) return;

    if (action.type === "use_skill" && action.skillId && g.phase === "character_select") {
      assignCharacter(g, action.playerId, action.skillId);
      if ((g as any).phase === "playing") {
        startTurn(g);
      }
      localSeqRef.current++;
      setLocalView(buildPlayerView(g, 0, localSeqRef.current));
      return;
    }

    if (action.type === "use_card" && action.cardId) {
      const ok = useCard(g, action.playerId, action.cardId, action.targetIds || []);
      if (ok) {
        SFX.bite();
        localSeqRef.current++;
        setLocalView(buildPlayerView(g, 0, localSeqRef.current));
      } else {
        SFX.err();
      }
      return;
    }

    if (action.type === "use_skill" && action.skillId) {
      const ok = useSkill(g, action.playerId, action.skillId, action.targetId, action.extra);
      if (ok) {
        SFX.skill();
        localSeqRef.current++;
        setLocalView(buildPlayerView(g, 0, localSeqRef.current));
      } else {
        SFX.err();
      }
      return;
    }

    if (action.type === "discard" && action.cardIds) {
      const ok = discardToLimit(g, action.playerId, action.cardIds);
      if (ok) {
        localSeqRef.current++;
        setLocalView(buildPlayerView(g, 0, localSeqRef.current));
      }
      return;
    }

    if (action.type === "pass" && g.subPhase === "discard" && action.playerId === g.turn) {
      autoDiscard(g, action.playerId);
      localSeqRef.current++;
      setLocalView(buildPlayerView(g, 0, localSeqRef.current));
      return;
    }

    if (action.type === "pass" && g.subPhase === "play" && action.playerId === g.turn) {
      const p = g.players[action.playerId];
      const limit = p.hp + g.handLimitBonus;
      if (p.hand.length <= limit) {
        g.subPhase = "discard";
        autoDiscard(g, action.playerId);
      } else {
        g.subPhase = "discard";
      }
      localSeqRef.current++;
      setLocalView(buildPlayerView(g, 0, localSeqRef.current));
      return;
    }


    if (action.type === "react") {
      const ok = submitReact(g, action.playerId, action.reactType || "pass", action.extra);
      if (ok) {
        SFX.dodge();
        localSeqRef.current++;
        setLocalView(buildPlayerView(g, 0, localSeqRef.current));
      } else {
        SFX.err();
      }
      return;
    }
  }

  function runLocalAi() {
    const g = localGameRef.current;
    if (!g) return;
    if (g.phase === "character_select") {
      for (let i = 1; i < g.players.length; i++) {
        if (!g.players[i].character) {
          autoAssignCharacters(g);
          break;
        }
      }
      if ((g as any).phase === "playing") {
        startTurn(g);
      }
      localSeqRef.current++;
      setLocalView(buildPlayerView(g, 0, localSeqRef.current));
      return;
    }

    if (g.phase !== "playing") return;

    // AI turn
    if (g.turn !== 0 && !g.players[g.turn].isDead && !g.pendingReacts) {
      const action = aiAction(g);
      if (action) {
        setTimeout(() => {
          handleLocalAction(action);
          setTimeout(runLocalAi, 600);
        }, 600);
      }
      return;
    }

    // AI reaction
    if (g.pendingReacts) {
      for (const pr of g.pendingReacts) {
        if (pr.playerId !== 0) {
          const action = aiAction(g, pr.playerId);
          if (action) {
            setTimeout(() => {
              handleLocalAction(action);
              setTimeout(runLocalAi, 400);
            }, 400);
          } else {
            setTimeout(() => {
              handleLocalAction({ type: "react", playerId: pr.playerId, reactType: "pass" });
              setTimeout(runLocalAi, 300);
            }, 300);
          }
          return; // process one at a time
        }
      }
    }
  }

  useEffect(() => {
    if (screen === "local-game") {
      runLocalAi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, localView?.seq]);

  // Turn notice & damage animations
  useEffect(() => {
    const view = mpView || localView;
    if (!view) { prevViewRef.current = null; return; }
    const prev = prevViewRef.current;

    // Turn change notice
    if (prev && prev.turn !== view.turn && view.phase === "playing") {
      const turnPlayer = view.players[view.turn];
      if (turnPlayer) {
        const isMe = view.turn === view.myIndex;
        setTurnNotice(isMe ? "▶ 你的回合" : `${turnPlayer.name} 的回合`);
        setTimeout(() => setTurnNotice(null), 1800);
      }
    }

    // Damage / heal animations on self
    if (prev) {
      const prevMe = prev.players[0];
      const currMe = view.players[0];
      if (currMe.hp < prevMe.hp) {
        const damage = prevMe.hp - currMe.hp;
        const id = ++dmgIdRef.current;
        setDamageAnims((a) => [...a, { id, text: `-${damage}`, x: 50, y: 60, color: "#ff4444" }]);
        setTimeout(() => setDamageAnims((a) => a.filter((d) => d.id !== id)), 1200);
      } else if (currMe.hp > prevMe.hp) {
        const heal = currMe.hp - prevMe.hp;
        const id = ++dmgIdRef.current;
        setDamageAnims((a) => [...a, { id, text: `+${heal}`, x: 50, y: 60, color: "#44ff44" }]);
        setTimeout(() => setDamageAnims((a) => a.filter((d) => d.id !== id)), 1200);
      }
    }

    prevViewRef.current = view;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpView?.seq, localView?.seq]);

  // ── Multiplayer ──────────────────────────────────

  async function mpCreate() {
    setMpError("");
    SFX.click();
    const name = playerName.trim() || "玩家";
    const res = await fetch("/api/wolf-chicken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", clientId: getMpClientId(), name }),
    });
    const data = await res.json();
    if (!data.ok) { setMpError(data.error || "创建失败"); return; }
    setMpCode(data.code);
    setMpPlayerId(data.playerId);
    setMpIsHost(true);
    setMpPlayers(data.players);
    writeMPSession({ code: data.code, playerId: data.playerId, isHost: true });
    setScreen("mp-waiting");
  }

  async function mpJoin() {
    if (!mpJoinCode.trim()) { setMpError("请输入房间号"); return; }
    setMpError("");
    SFX.click();
    const name = playerName.trim() || "玩家";
    const res = await fetch("/api/wolf-chicken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", clientId: getMpClientId(), code: mpJoinCode.trim(), name }),
    });
    const data = await res.json();
    if (!data.ok) { setMpError(data.error || "加入失败"); return; }
    setMpCode(mpJoinCode.trim());
    setMpPlayerId(data.playerId);
    setMpIsHost(false);
    setMpPlayers(data.players);
    writeMPSession({ code: mpJoinCode.trim(), playerId: data.playerId, isHost: false });
    setScreen("mp-waiting");
  }

  async function mpAddAI() {
    SFX.click();
    const res = await fetch("/api/wolf-chicken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addAI", code: mpCode, playerId: mpPlayerId }),
    });
    const data = await res.json();
    if (data.ok) setMpPlayers([...data.players]);
  }

  async function mpStart() {
    SFX.click();
    const res = await fetch("/api/wolf-chicken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", code: mpCode, playerId: mpPlayerId }),
    });
    const data = await res.json();
    if (data.ok) {
      setScreen("mp-game");
      startMPPoll(mpCode, mpPlayerId);
    }
  }

  async function mpLeave() {
    if (!mpCode) { clearMPSession(); setScreen("lobby"); return; }
    await fetch("/api/wolf-chicken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave", code: mpCode, playerId: mpPlayerId, clientId: getMpClientId() }),
    });
    clearMPSession();
    stopMPPoll();
    setScreen("lobby");
  }

  async function mpSendAction(actType: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/wolf-chicken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "act", code: mpCode, playerId: mpPlayerId, actType, ...extra }),
    });
    const data = await res.json();
    if (data.ok && data.view) {
      setMpView(data.view);
      setMpSeq(data.view.seq);
    }
  }

  function startMPPoll(code: string, playerId: string) {
    stopMPPoll();
    mpPollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/wolf-chicken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "poll", code, playerId }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; view?: PlayerView; players?: MPRoomPlayer[]; state?: string } | null;
        if (!data?.ok) {
          stopMPPoll();
          setMpError("房间已关闭");
          setScreen("lobby");
          return;
        }
        if (data.view) {
          setMpView(data.view);
          setMpSeq(data.view.seq);
          if (data.view.phase === "ended" && !showResult) {
            setShowResult(true);
          }
        }
        if (data.players && screen === "mp-waiting") {
          setMpPlayers(data.players);
        }
        if (data.state === "playing" && screen === "mp-waiting") {
          setScreen("mp-game");
        }
      } catch {}
    }, 1000);
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
    if (session) {
      resumeMpRoom(session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resumeMpRoom(session: MPSession) {
    const res = await fetch("/api/wolf-chicken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resume", code: session.code, playerId: session.playerId, clientId: getMpClientId() }),
    });
    const data = await res.json();
    if (!data.ok) { clearMPSession(); return; }
    setMpCode(session.code);
    setMpPlayerId(data.playerId);
    setMpIsHost(data.isHost);
    setMpPlayers(data.players);
    if (data.state === "playing" && data.view) {
      setMpView(data.view);
      setScreen("mp-game");
      startMPPoll(session.code, data.playerId);
    } else {
      setScreen("mp-waiting");
    }
  }

  // ── Unified Action Handler ───────────────────────

  const currentView = mpView || localView;
  const isLocal = screen === "local-game";

  function onSelectCard(cardId: string) {
    // 弃牌阶段：点击牌选择/取消弃牌
    if (currentView?.subPhase === "discard" && isMyTurn) {
      setDiscardCardIds((prev) => {
        if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
        return [...prev, cardId];
      });
      return;
    }
    // 出牌阶段：点击牌选择/取消出牌
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
      setSelectedTargets([]);
    } else {
      setSelectedCardId(cardId);
      setSelectedSkillId(null);
      setSelectedTargets([]);
    }
  }

  function onSelectSkill(skillId: string) {
    if (selectedSkillId === skillId) {
      setSelectedSkillId(null);
      setSelectedTargets([]);
    } else {
      setSelectedSkillId(skillId);
      setSelectedCardId(null);
      setSelectedTargets([]);
    }
  }

  function onSelectTarget(targetId: number) {
    if (selectedTargets.includes(targetId)) {
      setSelectedTargets(selectedTargets.filter((t) => t !== targetId));
    } else {
      setSelectedTargets([...selectedTargets, targetId]);
    }
  }

  function onConfirmAction() {
    if (!currentView) return;
    const myId = currentView.myId;
    const n = currentView.players.length;
    // Convert remapped targetIds back to original IDs for multiplayer
    const originalTargets = selectedTargets.length > 0
      ? selectedTargets.map((tid) => (tid + myId) % n)
      : undefined;

    if (selectedCardId) {
      const action: ActionRequest = {
        type: "use_card",
        playerId: myId,
        cardId: selectedCardId,
        targetIds: originalTargets,
      };
      if (isLocal) handleLocalAction(action);
      else mpSendAction("use_card", { cardId: selectedCardId, targetIds: originalTargets });
      setSelectedCardId(null);
      setSelectedTargets([]);
      return;
    }

    if (selectedSkillId) {
      const action: ActionRequest = {
        type: "use_skill",
        playerId: myId,
        skillId: selectedSkillId,
        targetId: originalTargets?.[0],
      };
      if (isLocal) handleLocalAction(action);
      else mpSendAction("use_skill", { skillId: selectedSkillId, targetId: originalTargets?.[0] });
      setSelectedSkillId(null);
      setSelectedTargets([]);
      return;
    }

    // end turn / pass
    if (currentView.subPhase === "play") {
      const action: ActionRequest = { type: "pass", playerId: myId };
      if (isLocal) handleLocalAction(action);
      else mpSendAction("pass");
    }
  }

  function onReact(reactType: string, extra?: unknown) {
    if (!currentView) return;
    const myId = currentView.myId;
    const action: ActionRequest = { type: "react", playerId: myId, reactType, extra };
    if (isLocal) handleLocalAction(action);
    else mpSendAction("react", { reactType, extra });
  }

  function onDiscard(cardIds: string[]) {
    if (!currentView) return;
    const myId = currentView.myId;
    const action: ActionRequest = { type: "discard", playerId: myId, cardIds };
    if (isLocal) handleLocalAction(action);
    else mpSendAction("discard", { cardIds });
  }

  function onSelectCharacter(charId: string) {
    if (!currentView) return;
    const myId = currentView.myId;
    const action: ActionRequest = { type: "use_skill", playerId: myId, skillId: charId };
    if (isLocal) handleLocalAction(action);
    else mpSendAction("use_skill", { skillId: charId });
  }

  function isTargetable(targetId: number): boolean {
    if (!isMyTurn || currentView!.subPhase !== "play") return false;
    if (selectedCardId) {
      const targets = currentView!.targetableMap[`card_${selectedCardId}`];
      return targets ? targets.includes(targetId) : false;
    }
    if (selectedSkillId) {
      const targets = currentView!.targetableMap[`skill_${selectedSkillId}`];
      return targets ? targets.includes(targetId) : false;
    }
    return false;
  }

  // ── Render ───────────────────────────────────────

  if (screen === "lobby") {
    return (
      <div className="wolf-chicken-game flex flex-col items-center justify-center p-6">
        <Link href="/fun" className="absolute top-5 left-5 text-sm text-[var(--app-muted)] hover:text-[var(--app-fg)] transition-colors">
          ← 返回 Fun
        </Link>
        <h1 className="text-5xl font-bold mb-2">🐺 狼鸡杀 🐔</h1>
        <p className="text-[var(--app-muted)] mb-10">波风水门大战坚果墙</p>

        {lobbyMode === "choose" && (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onClick={() => { SFX.click(); setLobbyMode("local"); }} className="wc-btn border-[var(--app-border-strong)] text-[var(--app-fg)] hover:bg-[var(--app-surface)]">
              本地游戏
            </button>
            <button onClick={() => { SFX.click(); setLobbyMode("mp"); }} className="wc-btn border-[var(--app-border-strong)] text-[var(--app-fg)] hover:bg-[var(--app-surface)]">
              联机对战
            </button>
          </div>
        )}

        {lobbyMode === "local" && (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <input
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); writeStoredPlayerName(e.target.value); }}
              placeholder="你的昵称"
              className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm text-[var(--app-fg)] outline-none focus:border-[var(--app-border-strong)]"
            />
            <button onClick={startLocalGame} className="wc-btn border-[#44aa44] text-[#88ee88] hover:bg-[#082818]">
              开始游戏
            </button>
            <button onClick={() => setLobbyMode("choose")} className="text-sm text-[var(--app-muted)] hover:text-[var(--app-fg)]">
              返回
            </button>
          </div>
        )}

        {lobbyMode === "mp" && (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <input
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); writeStoredPlayerName(e.target.value); }}
              placeholder="你的昵称"
              className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm text-[var(--app-fg)] outline-none focus:border-[var(--app-border-strong)]"
            />
            <button onClick={mpCreate} className="wc-btn border-[#4488ff] text-[#88aaff] hover:bg-[#08204a]">
              创建房间
            </button>
            <div className="flex gap-2">
              <input
                value={mpJoinCode}
                onChange={(e) => setMpJoinCode(e.target.value)}
                placeholder="房间号"
                className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm text-[var(--app-fg)] outline-none focus:border-[var(--app-border-strong)]"
              />
              <button onClick={mpJoin} className="wc-btn border-[var(--app-border-strong)] text-[var(--app-fg)] hover:bg-[var(--app-surface)] px-4">
                加入
              </button>
            </div>
            {mpError && <p className="text-sm text-[#c22]">{mpError}</p>}
            <button onClick={() => setLobbyMode("choose")} className="text-sm text-[var(--app-muted)] hover:text-[var(--app-fg)]">
              返回
            </button>
          </div>
        )}
      </div>
    );
  }

  if (screen === "mp-waiting") {
    return (
      <div className="wolf-chicken-game flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold mb-4">等待其他玩家</h1>
        <p className="text-[var(--app-muted)] mb-6">房间号: <span className="text-xl font-mono text-[#d4a843]">{mpCode}</span></p>
        <div className="flex flex-col gap-2 mb-6 w-full max-w-xs">
          {mpPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2">
              <span>{p.name} {p.isAI && "🤖"}</span>
              {mpIsHost && p.id !== mpPlayerId && (
                <button onClick={async () => {
                  const res = await fetch("/api/wolf-chicken", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "leave", code: mpCode, playerId: p.id }),
                  });
                  const data = await res.json();
                  if (data.ok) setMpPlayers(data.players || mpPlayers.filter((pl) => pl.id !== p.id));
                }} className="text-xs text-[#c22] hover:underline">踢出</button>
              )}
            </div>
          ))}
        </div>
        {mpIsHost && (
          <div className="flex gap-2 mb-4">
            <button onClick={mpAddAI} className="wc-btn border-[var(--app-border-strong)] text-[var(--app-fg)] text-xs px-3 py-1.5">添加AI</button>
            <button onClick={mpStart} className="wc-btn border-[#44aa44] text-[#88ee88] text-xs px-3 py-1.5 hover:bg-[#082818]">开始游戏</button>
          </div>
        )}
        <button onClick={mpLeave} className="text-sm text-[var(--app-muted)] hover:text-[#c22]">离开房间</button>
      </div>
    );
  }

  // ── Game Screen (local or mp) ────────────────────

  if (!currentView) return null;

  const isMyTurn = currentView.myIndex === currentView.turn && currentView.phase === "playing";
  const myPlayer = currentView.players[0];

  // Character select phase
  if (currentView.phase === "character_select") {
    const taken = new Set(currentView.players.map((p) => p.characterId).filter(Boolean));
    return (
      <div className="wolf-chicken-game flex flex-col items-center justify-center p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">选择你的角色</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
          {CHARACTERS.map((char) => {
            const disabled = taken.has(char.id);
            return (
              <button
                key={char.id}
                onClick={() => !disabled && onSelectCharacter(char.id)}
                disabled={disabled}
                className={`rounded-xl border p-4 text-left transition-all ${
                  disabled
                    ? "border-[var(--app-border)] opacity-40 cursor-not-allowed"
                    : "border-[var(--app-border-strong)] hover:border-[#d4a843] hover:shadow-lg bg-[var(--app-surface)]"
                }`}
              >
                <div className="text-3xl mb-1">{char.emoji}</div>
                <div className="font-bold text-sm">{char.name}</div>
                <div className="text-xs text-[var(--app-muted)] mt-1">体力: {char.maxHp}</div>
                {char.skills.map((s) => (
                  <div key={s.id} className="text-[10px] text-[var(--app-muted)] mt-0.5 leading-tight">
                    {s.isLimited ? "【限】" : s.isLocked ? "【锁】" : ""}{s.name}
                  </div>
                ))}
              </button>
            );
          })}
        </div>
        {isLocal && (
          <button
            onClick={() => {
              const g = localGameRef.current;
              if (g) {
                autoAssignCharacters(g);
                if (g.phase === "playing") startTurn(g);
                setLocalView(buildPlayerView(g, 0, 0));
              }
            }}
            className="mt-6 wc-btn border-[var(--app-border-strong)] text-[var(--app-fg)] text-sm px-4 py-2"
          >
            随机分配剩余角色
          </button>
        )}
      </div>
    );
  }

  // Result overlay
  if (currentView.phase === "ended" && showResult) {
    return (
      <div className="wolf-chicken-game flex flex-col items-center justify-center p-6">
        <h2 className="text-4xl font-bold mb-4">🏆 游戏结束</h2>
        <p className="text-xl mb-2">{currentView.resultReason}</p>
        <div className="mt-6 flex flex-col gap-2 text-sm">
          {currentView.players.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <span>{p.isDead ? "💀" : "😀"}</span>
              <span className="font-bold">{p.name}</span>
              <span className="text-[var(--app-muted)]">
                {p.campRevealed ? `${CAMP_EMOJIS[p.camp!]} ${CAMP_NAMES[p.camp!]}` : "身份隐藏"}
              </span>
              <span className="text-[var(--app-muted)]">{p.characterId}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-8">
          {isLocal && (
            <button onClick={startLocalGame} className="wc-btn border-[#44aa44] text-[#88ee88] hover:bg-[#082818]">再来一局</button>
          )}
          {!isLocal && mpIsHost && (
            <button onClick={async () => {
              const res = await fetch("/api/wolf-chicken", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "next", code: mpCode, playerId: mpPlayerId }),
              });
              const data = await res.json();
              if (data.ok) {
                setShowResult(false);
                setMpView(null);
                setScreen("mp-waiting");
                stopMPPoll();
              }
            }} className="wc-btn border-[#44aa44] text-[#88ee88] hover:bg-[#082818]">返回大厅</button>
          )}
          <button onClick={() => { stopMPPoll(); setScreen("lobby"); }} className="wc-btn border-[var(--app-border-strong)] text-[var(--app-fg)] hover:bg-[var(--app-surface)]">
            退出
          </button>
        </div>
      </div>
    );
  }

  // ── Main Game Table ──────────────────────────────

  const opponents = currentView.players.slice(1);
  const myHand = currentView.myHand;
  const pendingReact = currentView.pendingReacts?.find((r) => r.playerId === currentView.myId);

  return (
    <div className="wolf-chicken-game flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--app-border)] bg-[var(--app-surface)]/60">
        <div className="flex items-center gap-3">
          <Link href="/fun" className="text-xs text-[var(--app-muted)] hover:text-[var(--app-fg)]">← 返回</Link>
          <span className="text-xs text-[var(--app-muted)]">第 {currentView.round} 轮</span>
          {mpCode && <span className="text-xs text-[#d4a843]">房间 {mpCode}</span>}
        </div>
        <div className="text-xs text-[var(--app-muted)]">
          牌堆: {currentView.deckCount} | 弃牌: {currentView.discardCount}
        </div>
      </div>

      {/* Battle area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* Opponents row */}
        <div className="flex gap-4 mb-6 flex-wrap justify-center">
          {opponents.map((p, idx) => (
            <OpponentAvatar
              key={idx}
              player={p}
              isCurrent={currentView.turn === p.id}
              isTargetable={isTargetable(p.id)}
              isSelected={selectedTargets.includes(p.id)}
              onClick={() => isTargetable(p.id) && onSelectTarget(p.id)}
            />
          ))}
        </div>

        {/* Center battlefield */}
        <div className="flex items-center gap-6 mb-6">
          <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)]/40 px-4 py-3 text-center min-w-[80px]">
            <div className="text-[10px] text-[var(--app-muted)] uppercase tracking-wider">牌堆</div>
            <div className="text-xl font-bold">{currentView.deckCount}</div>
          </div>

          {currentView.currentCard && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[var(--app-muted)] mb-1">当前出牌</span>
              <CardComponent card={currentView.currentCard} size="md" />
            </div>
          )}

          {currentView.reactContext && (
            <div className="rounded-lg border border-[#c22] bg-[#7a1008]/20 px-4 py-2 text-sm text-[#ff9988]">
              {currentView.reactContext.type === "dodge" && "请出【躲】！"}
              {currentView.reactContext.type === "aoe_dodge" && "【狼群入侵】请出【躲】！"}
              {currentView.reactContext.type === "aoe_bite" && "【万鸡齐啄】请出【咬/啄】！"}
            </div>
          )}

          {isMyTurn && currentView.subPhase === "play" && !pendingReact && (
            <div className="rounded-lg border border-[#44aa44] bg-[#082818]/30 px-4 py-2 text-sm text-[#88ee88]">
              你的回合
            </div>
          )}
        </div>

        {/* My area */}
        <div className="w-full max-w-3xl">
          {/* My avatar + info */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`wc-avatar ${myPlayer.isDead ? "dead" : ""} ${isMyTurn ? "current" : ""}`}>
              {myPlayer.characterId ? CHARACTERS.find((c) => c.id === myPlayer.characterId)?.emoji : "🎭"}
            </div>
            <div>
              <div className="text-sm font-bold">{myPlayer.name}</div>
              <div className="text-xs text-[var(--app-muted)]">
                {myPlayer.characterId && CHARACTERS.find((c) => c.id === myPlayer.characterId)?.name}
                {myPlayer.campRevealed && ` · ${CAMP_EMOJIS[myPlayer.camp!]} ${CAMP_NAMES[myPlayer.camp!]}`}
              </div>
              <HpBar hp={myPlayer.hp} maxHp={myPlayer.maxHp} />
              {Object.entries(myPlayer.tokens).filter(([_, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="text-[10px] text-[#d4a843] mr-2">{k}: {v}</span>
              ))}
            </div>
          </div>

          {/* Equips */}
          {myPlayer.equips.length > 0 && (
            <div className="flex gap-2 mb-3">
              {myPlayer.equips.map((eq) => (
                <div key={eq.id} className="text-[10px] border border-[var(--app-border)] rounded px-2 py-0.5 bg-[var(--app-surface)]">
                  {eq.name}
                </div>
              ))}
            </div>
          )}

          {/* Hand */}
          <div className="flex gap-1.5 justify-center flex-wrap mb-3">
            {myHand.map((card) => (
              <CardComponent
                key={card.id}
                card={card}
                selected={selectedCardId === card.id}
                discarding={discardCardIds.includes(card.id)}
                onClick={() => onSelectCard(card.id)}
              />
            ))}
          </div>

          {/* Skills */}
          {myPlayer.characterId && (
            <div className="flex gap-2 justify-center mb-3 flex-wrap">
              {CHARACTERS.find((c) => c.id === myPlayer.characterId)?.skills.map((skill) => {
                const usable = currentView.myActions.includes(`skill_${skill.id}`);
                const used = myPlayer.limitedUsed[skill.id];
                return (
                  <button
                    key={skill.id}
                    onClick={() => usable && !used && onSelectSkill(skill.id)}
                    disabled={!usable || used}
                    className={`text-xs px-3 py-1 rounded border transition-all ${
                      selectedSkillId === skill.id
                        ? "border-[#d4a843] bg-[#d4a843]/20 text-[#d4a843]"
                        : usable && !used
                        ? "border-[var(--app-border-strong)] text-[var(--app-fg)] hover:border-[#d4a843]"
                        : "border-[var(--app-border)] text-[var(--app-muted)] opacity-50 cursor-not-allowed"
                    }`}
                    title={skill.desc}
                  >
                    {skill.isLimited && used ? "【已用】" : ""}{skill.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action bar */}
          <div className="flex gap-2 justify-center">
            {pendingReact ? (
              <div className="flex gap-2">
                {pendingReact.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (opt.type === "dodge" && opt.cardIds) {
                        onReact("dodge", { cardIds: [opt.cardIds[0]] });
                      } else if (opt.type === "custom" && opt.skillId) {
                        onReact("custom", { skillId: opt.skillId });
                      } else {
                        onReact(opt.type);
                      }
                    }}
                    className={`wc-btn text-sm px-4 py-2 ${
                      opt.type === "pass"
                        ? "border-[#333] text-[#555]"
                        : "border-[#4488ff] text-[#88aaff] hover:bg-[#08204a]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : currentView.subPhase === "discard" && isMyTurn ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-[var(--app-muted)]">
                  弃牌阶段：需弃至 {myPlayer.hp + (currentView.handLimitBonus || 0)} 张
                  {discardCardIds.length > 0 && `（已选 ${discardCardIds.length} 张）`}
                </p>
                <p className="text-[10px] text-[var(--app-muted)]">点击手牌选择要弃的牌</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (discardCardIds.length > 0) {
                        onDiscard(discardCardIds);
                        setDiscardCardIds([]);
                      }
                    }}
                    disabled={discardCardIds.length === 0}
                    className={`wc-btn text-sm px-4 py-2 ${
                      discardCardIds.length > 0
                        ? "border-[#c22] text-[#ff9988] hover:bg-[#7a1008]/20"
                        : "border-[var(--app-border)] text-[var(--app-muted)] opacity-50 cursor-not-allowed"
                    }`}
                  >
                    确认弃牌
                  </button>
                  <button
                    onClick={() => {
                      const needDiscard = myHand.length - (myPlayer.hp + (currentView.handLimitBonus || 0));
                      if (needDiscard > 0) {
                        const cardIds = myHand.slice(0, needDiscard).map((c) => c.id);
                        onDiscard(cardIds);
                        setDiscardCardIds([]);
                      }
                    }}
                    className="wc-btn border-[var(--app-border-strong)] text-[var(--app-fg)] text-sm px-4 py-2 hover:bg-[var(--app-surface)]"
                  >
                    自动弃牌
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onConfirmAction}
                disabled={!isMyTurn || currentView.subPhase !== "play"}
                className={`wc-btn text-sm px-6 py-2 ${
                  isMyTurn && currentView.subPhase === "play"
                    ? selectedCardId || selectedSkillId
                      ? "border-[#44aa44] text-[#88ee88] hover:bg-[#082818]"
                      : "border-[var(--app-border-strong)] text-[var(--app-fg)] hover:bg-[var(--app-surface)]"
                    : "border-[var(--app-border)] text-[var(--app-muted)] opacity-50 cursor-not-allowed"
                }`}
              >
                {selectedCardId ? "出牌" : selectedSkillId ? "发动技能" : "结束回合"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Damage float animations */}
      {damageAnims.map((anim) => (
        <div
          key={anim.id}
          className="damage-float"
          style={{ left: anim.x, top: anim.y, color: anim.color }}
        >
          {anim.text}
        </div>
      ))}

      {/* Turn notice */}
      {turnNotice && (
        <div className="turn-notice text-[#d4a843]">{turnNotice}</div>
      )}

      {/* Log */}
      <div className="absolute left-2 bottom-2 w-52 max-h-36 overflow-hidden bg-[var(--app-surface)]/80 border border-[var(--app-border)] rounded-lg p-2 text-[10px] z-10 backdrop-blur-sm shadow-lg">
        {currentView.log.slice(0, 10).map((entry, i) => (
          <div key={i} className="text-[var(--app-muted)] truncate leading-tight">{entry}</div>
        ))}
      </div>
    </div>
  );
}

// ── Sub Components ─────────────────────────────────

function CardComponent({ card, selected, discarding, onClick, size = "sm" }: { card: Card; selected?: boolean; discarding?: boolean; onClick?: () => void; size?: "sm" | "md" }) {
  const w = size === "md" ? 90 : 64;
  const h = size === "md" ? 126 : 90;
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-lg border-2 bg-[#f5f0e8] cursor-pointer transition-all ${
        discarding
          ? "border-[#c22] -translate-y-1 shadow-lg shadow-red-500/30"
          : selected
          ? "border-[#d4a843] -translate-y-2 shadow-lg shadow-yellow-500/30"
          : "border-[#1a1a1a] hover:-translate-y-1"
      }`}
      style={{ width: w, height: h }}
    >
      <div className="text-lg font-bold" style={{ color: SUIT_COLORS[card.suit] }}>
        {SUIT_SYMBOLS[card.suit]}{RANK_NAMES[card.rank]}
      </div>
      <div className="text-[9px] text-[#1a1a1a] text-center px-1 leading-tight mt-0.5">{card.name}</div>
      {discarding && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#c22] rounded-full flex items-center justify-center text-[8px] text-white font-bold">弃</div>}
    </div>
  );
}

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  return (
    <div className="wc-hp-bar">
      {Array.from({ length: maxHp }).map((_, i) => (
        <div key={i} className={`wc-hp-dot ${i >= hp ? "lost" : ""}`} />
      ))}
    </div>
  );
}

function OpponentAvatar({ player, isCurrent, isTargetable, isSelected, onClick }: {
  player: PlayerView["players"][number];
  isCurrent: boolean;
  isTargetable: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const char = CHARACTERS.find((c) => c.id === player.characterId);
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center transition-all ${isTargetable ? "cursor-pointer" : "cursor-default"} ${
        isSelected ? "scale-110" : ""
      }`}
    >
      <div className={`wc-avatar ${player.isDead ? "dead" : ""} ${isCurrent ? "current" : ""} ${isTargetable ? "targetable" : ""} ${isSelected ? "selected-target" : ""}`}>
        {char?.emoji || "🎭"}
      </div>
      <div className="text-[10px] mt-1 font-medium">{player.name}</div>
      <HpBar hp={player.hp} maxHp={player.maxHp} />
      <div className="text-[9px] text-[var(--app-muted)]">
        {player.handCount}张
        {player.equips.length > 0 && ` · ${player.equips.length}装备`}
      </div>
    </button>
  );
}
