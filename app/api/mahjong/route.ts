import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import {
  type Tile,
  type Meld,
  makeDeck,
  shuffle,
  sortHand,
  tileOrder,
  calcFan,
  canPeng,
  canGangDiscard,
  huOnTile,
  selfDrawOk,
  selfGangs,
  canChi,
  aiPick,
} from "@/app/fun/mahjong/game-core";
import { getCurrentAuthUser } from "@/app/lib/auth-current";

export const runtime = "nodejs";

/* ═══════════════════════════════════════════════════
   湖州麻将 · 联机 API（服务端权威 + 轮询）
   ═══════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────

interface RoomPlayer {
  id: string;
  clientId?: string;
  name: string;
  isAI: boolean;
  score: number;
}

interface GameState {
  deck: Tile[];
  di: number;
  hands: Tile[][];
  melds: Meld[][];
  discs: Tile[][];
  cur: number;
  lastD: Tile | null;
  lastDpid: number;
  round: number;
  dealer: number;
  phase: "discard" | "react" | "gang_draw" | "ended";
  // reaction tracking
  reactMap: Record<number, string[]> | null;
  reactFrom: number;
  reactTile: Tile | null;
  // per-player pending buttons
  pendingBtns: Record<number, string[]>;
  chiOpts: Tile[][] | null;
  chiPid: number;
  // result
  result: {
    winner: number;
    fan: { total: number; desc: string };
    delta: number[];
    isSelf: boolean;
    isDraw: boolean;
  } | null;
}

interface Room {
  code: string;
  players: RoomPlayer[];
  host: string;
  cfg: { base: number; punish: string; pthr: number };
  createdAt: number;
  state: "waiting" | "playing";
  seq: number;
  game: GameState | null;
}

type RoomRow = {
  code: string;
  data: string;
  created_at: Date | string;
  updated_at: Date | string;
};

const memoryRooms = new Map<string, Room>();

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function sql() {
  return neon(getDatabaseUrl());
}

async function ensureRoomDb() {
  if (!hasDatabase()) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS moon_mahjong_rooms (
      code TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function cloneRoom(room: Room): Room {
  return JSON.parse(JSON.stringify(room)) as Room;
}

function hydrateRoom(row: RoomRow): Room {
  return JSON.parse(row.data) as Room;
}

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function genId() {
  return Math.random().toString(36).slice(2, 8);
}

function cleanupMemoryRooms() {
  const now = Date.now();
  for (const [code, room] of memoryRooms) {
    if (now - room.createdAt > 3 * 60 * 60 * 1000) memoryRooms.delete(code);
  }
}

async function cleanupRooms() {
  cleanupMemoryRooms();
  if (!hasDatabase()) return;
  await ensureRoomDb();
  await sql()`
    DELETE FROM moon_mahjong_rooms
    WHERE created_at < NOW() - INTERVAL '3 hours'
  `;
}

async function loadRoom(code: string) {
  if (!hasDatabase()) {
    return memoryRooms.get(code) ?? null;
  }

  await ensureRoomDb();
  const rows = (await sql()`
    SELECT code, data, created_at, updated_at
    FROM moon_mahjong_rooms
    WHERE code = ${code}
    LIMIT 1
  `) as RoomRow[];
  const room = rows[0] ? hydrateRoom(rows[0]) : null;
  if (room) memoryRooms.set(room.code, room);
  return room;
}

async function loadAllRooms() {
  if (!hasDatabase()) {
    return Array.from(memoryRooms.values());
  }

  await ensureRoomDb();
  const rows = (await sql()`
    SELECT code, data, created_at, updated_at
    FROM moon_mahjong_rooms
    ORDER BY created_at ASC
  `) as RoomRow[];
  const rooms = rows.map(hydrateRoom);
  for (const room of rooms) {
    memoryRooms.set(room.code, room);
  }
  return rooms;
}

async function saveRoom(room: Room) {
  memoryRooms.set(room.code, room);
  if (!hasDatabase()) return;

  await ensureRoomDb();
  const snapshot = cloneRoom(room);
  await sql()`
    INSERT INTO moon_mahjong_rooms (code, data, created_at, updated_at)
    VALUES (${snapshot.code}, ${JSON.stringify(snapshot)}, ${new Date(snapshot.createdAt).toISOString()}, NOW())
    ON CONFLICT (code) DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = NOW()
  `;
}

async function deleteRoom(code: string) {
  memoryRooms.delete(code);
  if (!hasDatabase()) return;

  await ensureRoomDb();
  await sql()`
    DELETE FROM moon_mahjong_rooms
    WHERE code = ${code}
  `;
}

async function deleteAllRooms() {
  memoryRooms.clear();
  if (!hasDatabase()) return 0;

  await ensureRoomDb();
  const rooms = (await sql()`
    DELETE FROM moon_mahjong_rooms
    RETURNING code
  `) as Array<{ code: string }>;
  return rooms.length;
}

function markRoomAborted(room: Room) {
  if (!room.game) return false;
  if (room.game.phase === "ended" && room.game.result?.fan.desc === "管理员强制结束") return false;

  room.game.reactMap = null;
  room.game.pendingBtns = {};
  room.game.chiOpts = null;
  room.game.chiPid = -1;
  room.game.result = { winner: -1, fan: { total: 0, desc: "管理员强制结束" }, delta: [0, 0, 0, 0], isSelf: false, isDraw: true };
  room.game.phase = "ended";
  room.seq++;
  return true;
}

function findPlayerIndex(room: Room, playerId: string) {
  return room.players.findIndex((p) => p.id === playerId);
}

function normalizeRoomPlayerName(name: unknown) {
  if (typeof name !== "string") return "玩家";
  const trimmed = name.trim();
  return trimmed || "玩家";
}

// ── Game Logic (server-side) ───────────────────────

function initGame(room: Room) {
  const g: GameState = {
    deck: shuffle(makeDeck()),
    di: 0,
    hands: [[], [], [], []],
    melds: [[], [], [], []],
    discs: [[], [], [], []],
    cur: 0,
    lastD: null,
    lastDpid: -1,
    round: 1,
    dealer: Math.floor(Math.random() * 4),
    phase: "discard",
    reactMap: null,
    reactFrom: -1,
    reactTile: null,
    pendingBtns: {},
    chiOpts: null,
    chiPid: -1,
    result: null,
  };
  // deal 13 tiles each
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 13; j++) g.hands[i].push(g.deck[g.di++]);
  for (let i = 0; i < 4; i++) sortHand(g.hands[i]);
  room.game = g;
  room.state = "playing";
  room.seq++;
  // start dealer's turn
  startTurn(room, g.dealer);
}

function drawTile(g: GameState, pid: number): Tile | null {
  if (g.di >= g.deck.length) return null;
  const t = g.deck[g.di++];
  const hand = g.hands[pid];
  const idx = hand.findIndex((x) => tileOrder(x) > tileOrder(t));
  if (idx < 0) hand.push(t);
  else hand.splice(idx, 0, t);
  return t;
}

function startTurn(room: Room, pid: number) {
  const g = room.game!;
  g.cur = pid;
  g.phase = "discard";
  g.pendingBtns = {};
  g.chiOpts = null;
  sortHand(g.hands[pid]);
  const t = drawTile(g, pid);
  if (!t) {
    endDraw(g, room);
    return;
  }
  // check self-draw hu / gang
  const hu = selfDrawOk(g.hands[pid], g.melds[pid]);
  const gangs = selfGangs(g.hands[pid], g.melds[pid]);
  const isHuman = !room.players[pid].isAI;
  if (isHuman) {
    const btns = ["discard"];
    if (hu) btns.unshift("hu");
    if (gangs.length) btns.splice(btns.length - 1, 0, "gang_self");
    g.pendingBtns[pid] = btns;
  } else {
    // AI turn
    if (hu) { declareHu(g, room, pid, null, true); return; }
    if (gangs.length && Math.random() < 0.65) { doGang(g, room, pid, gangs[0], "self"); return; }
    doDiscard(g, room, pid, aiPick(g.hands[pid]));
  }
}

function doDiscard(g: GameState, room: Room, pid: number, idx: number) {
  const tile = g.hands[pid].splice(idx, 1)[0];
  g.discs[pid].push(tile);
  g.lastD = tile;
  g.lastDpid = pid;
  g.pendingBtns = {};
  checkReactions(g, room, pid, tile);
}

function checkReactions(g: GameState, room: Room, from: number, tile: Tile) {
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
  g.reactMap = reacts;
  g.reactFrom = from;
  g.reactTile = tile;

  if (!any) {
    g.reactMap = null;
    schedNext(g, room, from);
    return;
  }

  // hu priority — auto-claim for AI
  for (let i = 0; i < 4; i++) {
    if (!reacts[i]?.includes("hu")) continue;
    if (room.players[i].isAI) {
      declareHu(g, room, i, tile, false);
      return;
    }
    // human hu — show buttons
    g.phase = "react";
    g.pendingBtns[i] = [...new Set(["hu", ...reacts[i], "pass"])];
    room.seq++;
    return;
  }

  // no hu claimants — check other reactions
  // give human players a chance, AI reacts immediately if no humans want to
  const humanReactors = Object.keys(reacts).filter((k) => !room.players[+k].isAI);
  if (humanReactors.length > 0) {
    g.phase = "react";
    for (const k of humanReactors) {
      g.pendingBtns[+k] = [...reacts[+k], "pass"];
    }
    // AI will auto-pass after humans (handled in passAction when all humans pass)
    room.seq++;
  } else {
    // all AI — process immediately
    aiResolveReactions(g, room, reacts, from, tile);
  }
}

function aiResolveReactions(g: GameState, room: Room, reacts: Record<number, string[]>, from: number, tile: Tile) {
  for (let i = 0; i < 4; i++) {
    if (!room.players[i]?.isAI) continue;
    if (!reacts[i]) continue;
    if (reacts[i].includes("gang")) { doGang(g, room, i, tile, "discard"); return; }
    if (reacts[i].includes("peng")) { doPeng(g, room, i, tile); return; }
    const chi = canChi(g.hands[i], tile, from, i);
    if (chi.length) { doChi(g, room, i, tile, chi[0]); return; }
  }
  g.reactMap = null;
  schedNext(g, room, from);
}

function schedNext(g: GameState, room: Room, from: number) {
  const next = (from + 1) % 4;
  startTurn(room, next);
}

// ── Meld Actions ───────────────────────────────────

function doPeng(g: GameState, room: Room, pid: number, tile: Tile) {
  g.reactMap = null;
  g.pendingBtns = {};
  let rm = 0;
  g.hands[pid] = g.hands[pid].filter((t) => {
    if (t.id === tile.id && rm < 2) { rm++; return false; }
    return true;
  });
  g.melds[pid].push({ type: "peng", tiles: [tile, tile, tile] });
  g.cur = pid;
  g.phase = "discard";
  if (room.players[pid].isAI) {
    doDiscard(g, room, pid, aiPick(g.hands[pid]));
  } else {
    g.pendingBtns[pid] = ["discard"];
    room.seq++;
  }
}

function doChi(g: GameState, room: Room, pid: number, tile: Tile, seq: Tile[]) {
  g.reactMap = null;
  g.pendingBtns = {};
  for (const st of seq) {
    if (st.id === tile.id && st.suit === tile.suit && st.n === tile.n) continue;
    const i = g.hands[pid].findIndex((h) => h.id === st.id);
    if (i >= 0) g.hands[pid].splice(i, 1);
  }
  g.melds[pid].push({ type: "chi", tiles: seq });
  g.cur = pid;
  g.phase = "discard";
  if (room.players[pid].isAI) {
    doDiscard(g, room, pid, aiPick(g.hands[pid]));
  } else {
    g.pendingBtns[pid] = ["discard"];
    room.seq++;
  }
}

function doGang(g: GameState, room: Room, pid: number, tile: Tile, type: "self" | "discard") {
  g.reactMap = null;
  g.pendingBtns = {};
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
  // draw after gang
  g.cur = pid;
  const drawn = drawTile(g, pid);
  if (!drawn) { endDraw(g, room); return; }
  g.phase = "discard";
  if (room.players[pid].isAI) {
    if (selfDrawOk(g.hands[pid], g.melds[pid])) { declareHu(g, room, pid, null, true); return; }
    doDiscard(g, room, pid, aiPick(g.hands[pid]));
  } else {
    const hu = selfDrawOk(g.hands[pid], g.melds[pid]);
    g.pendingBtns[pid] = hu ? ["hu", "discard"] : ["discard"];
    room.seq++;
  }
}

function declareHu(g: GameState, room: Room, pid: number, disc: Tile | null, isSelf: boolean) {
  g.reactMap = null;
  g.pendingBtns = {};
  const hand = disc ? [...g.hands[pid], disc] : g.hands[pid];
  const fan = calcFan(hand, g.melds[pid], isSelf);
  const base = room.cfg.base || 10;
  const pts = fan.total * base;
  const delta = [0, 0, 0, 0];
  if (isSelf) {
    for (let i = 0; i < 4; i++) if (i !== pid) { delta[i] = -pts; delta[pid] += pts; }
  } else {
    delta[g.lastDpid] = -pts;
    delta[pid] = pts;
  }
  for (let i = 0; i < 4; i++) room.players[i].score += delta[i];
  g.dealer = pid;
  g.result = { winner: pid, fan, delta, isSelf, isDraw: false };
  g.phase = "ended";
  room.seq++;
}

function endDraw(g: GameState, room: Room) {
  g.reactMap = null;
  g.pendingBtns = {};
  g.result = { winner: -1, fan: { total: 0, desc: "" }, delta: [0, 0, 0, 0], isSelf: false, isDraw: true };
  g.phase = "ended";
  room.seq++;
}

// ── Player View (hide other hands) ─────────────────

function playerView(room: Room, pid: number) {
  const g = room.game;
  if (!g) return { phase: room.state, players: room.players, cfg: room.cfg, myIndex: pid };

  // map indices so this player is always index 0
  const remap = [(pid + 0) % 4, (pid + 1) % 4, (pid + 2) % 4, (pid + 3) % 4];

  const myHand = g.hands[pid];
  const myActions = g.pendingBtns[pid] || [];
  const isChiForMe = g.chiPid === pid;

  return {
    phase: g.phase,
    myIndex: pid,
    players: room.players.map((p) => ({
      name: p.name,
      score: p.score,
      isAI: p.isAI,
    })),
    hand: myHand,
    handCounts: g.hands.map((h) => h.length),
    melds: remap.map((ri) => g.melds[ri]),
    discs: remap.map((ri) => g.discs[ri]),
    cur: (g.cur - pid + 4) % 4,
    lastD: g.lastD,
    lastDpid: (g.lastDpid - pid + 4) % 4,
    tilesLeft: g.deck.length - g.di,
    round: g.round,
    dealer: (g.dealer - pid + 4) % 4,
    myActions,
    chiOpts: isChiForMe ? g.chiOpts : null,
    result: g.result
      ? {
          ...g.result,
          winner: (g.result.winner - pid + 4) % 4,
          delta: remap.map((ri) => g.result!.delta[ri]),
        }
      : null,
    cfg: room.cfg,
    seq: room.seq,
  };
}

// ── POST Handler ───────────────────────────────────

export async function POST(req: NextRequest) {
  await cleanupRooms();
  const body = await req.json();
  const { action } = body;

  // ── Create Room ──
  if (action === "create") {
    const code = genCode();
    const hostId = genId();
    const room: Room = {
      code,
      players: [{
        id: hostId,
        clientId: body.clientId,
        name: normalizeRoomPlayerName(body.name),
        isAI: false,
        score: body.score || 1000,
      }],
      host: hostId,
      cfg: { base: body.base || 10, punish: body.punish || "喝一杯！", pthr: body.pthr || 0 },
      createdAt: Date.now(),
      state: "waiting",
      seq: 0,
      game: null,
    };
    await saveRoom(room);
    return NextResponse.json({ ok: true, code, playerId: hostId, players: room.players });
  }

  // ── Join Room ──
  if (action === "join") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    if (room.state !== "waiting") return NextResponse.json({ ok: false, error: "游戏已开始" });
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    if (clientId) {
      const existing = room.players.find((p) => !p.isAI && p.clientId === clientId);
      if (existing) {
        return NextResponse.json({
          ok: true,
          alreadyJoined: true,
          playerId: existing.id,
          players: room.players,
          cfg: room.cfg,
          seq: room.seq,
        });
      }
    }
    if (room.players.filter((p) => !p.isAI).length >= 4)
      return NextResponse.json({ ok: false, error: "房间已满" });
    const pid = genId();
    room.players.push({
      id: pid,
      clientId: clientId || undefined,
      name: normalizeRoomPlayerName(body.name),
      isAI: false,
      score: room.players[0].score,
    });
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, playerId: pid, players: room.players, cfg: room.cfg, seq: room.seq, isHost: false });
  }

  // ── Resume Room ──
  if (action === "resume") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });

    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const requestedPlayerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    let pid = requestedPlayerId ? findPlayerIndex(room, requestedPlayerId) : -1;
    if (pid < 0 && clientId) {
      pid = room.players.findIndex((p) => !p.isAI && p.clientId === clientId);
    }
    if (pid < 0) {
      return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    }

    const payload = {
      ok: true,
      playerId: room.players[pid].id,
      isHost: room.host === room.players[pid].id,
      players: room.players,
      cfg: room.cfg,
      seq: room.seq,
      state: room.state,
    };

    if (room.state === "playing") {
      return NextResponse.json({ ...payload, view: playerView(room, pid) });
    }

    return NextResponse.json(payload);
  }

  // ── Rename Player ──
  if (action === "rename") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    if (room.state !== "waiting") {
      return NextResponse.json({ ok: false, error: "游戏开始后暂不支持改昵称" }, { status: 400 });
    }

    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const requestedPlayerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    let pid = requestedPlayerId ? findPlayerIndex(room, requestedPlayerId) : -1;
    if (pid < 0 && clientId) {
      pid = room.players.findIndex((p) => !p.isAI && p.clientId === clientId);
    }
    if (pid < 0) {
      return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    }

    const nextName = normalizeRoomPlayerName(body.name);
    room.players[pid].name = nextName;
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, players: room.players, playerId: room.players[pid].id, seq: room.seq });
  }

  // ── Leave Room ──
  if (action === "leave") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    if (room.state !== "waiting") {
      return NextResponse.json({ ok: false, error: "游戏开始后暂不支持离开房间" }, { status: 400 });
    }

    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const requestedPlayerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    let pid = requestedPlayerId ? findPlayerIndex(room, requestedPlayerId) : -1;
    if (pid < 0 && clientId) {
      pid = room.players.findIndex((p) => !p.isAI && p.clientId === clientId);
    }
    if (pid < 0) {
      return NextResponse.json({ ok: true, removed: false });
    }

    const leavingPlayer = room.players[pid];
    room.players.splice(pid, 1);

    if (room.players.length === 0) {
      await deleteRoom(room.code);
      return NextResponse.json({ ok: true, removed: true, deleted: true });
    }

    if (room.host === leavingPlayer.id) {
      const nextHost = room.players.find((player) => !player.isAI) ?? room.players[0];
      room.host = nextHost.id;
    }

    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, removed: true, deleted: false, host: room.host });
  }

  // ── Abort Game ──
  if (action === "abort") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    if (room.host !== body.playerId) return NextResponse.json({ ok: false, error: "只有房主可以强制结束" }, { status: 403 });
    if (!room.game) {
      await deleteRoom(room.code);
      return NextResponse.json({ ok: true, deleted: true });
    }

    const g = room.game;
    g.reactMap = null;
    g.pendingBtns = {};
    g.chiOpts = null;
    g.chiPid = -1;
    g.result = { winner: -1, fan: { total: 0, desc: "强制结束" }, delta: [0, 0, 0, 0], isSelf: false, isDraw: true };
    g.phase = "ended";
    room.state = "playing";
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, view: playerView(room, findPlayerIndex(room, body.playerId)) });
  }

  // ── Abort All Games ──
  if (action === "abortAll") {
    const currentUser = await getCurrentAuthUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });
    }

    const rooms = await loadAllRooms();
    let affected = 0;
    let deleted = 0;

    for (const room of rooms) {
      if (!room.game) continue;
      if (markRoomAborted(room)) {
        affected++;
        await saveRoom(room);
      }
    }

    return NextResponse.json({ ok: true, affected, deleted });
  }

  // ── Purge All Rooms ──
  if (action === "purgeAll") {
    const currentUser = await getCurrentAuthUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });
    }

    const deleted = await deleteAllRooms();
    return NextResponse.json({ ok: true, deleted });
  }

  // ── Add AI ──
  if (action === "addAI") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    if (room.host !== body.playerId) return NextResponse.json({ ok: false, error: "只有房主可以添加AI" });
    if (room.players.length >= 4) return NextResponse.json({ ok: false, error: "房间已满" });
    const aiNames = ["机器人甲", "机器人乙", "机器人丙"];
    const aiCount = room.players.filter((p) => p.isAI).length;
    room.players.push({
      id: "ai_" + Date.now(),
      name: aiNames[aiCount] || "机器人",
      isAI: true,
      score: room.players[0].score,
    });
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, players: room.players, seq: room.seq });
  }

  // ── Start Game ──
  if (action === "start") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    if (room.host !== body.playerId) return NextResponse.json({ ok: false, error: "只有房主可以开始" });
    if (room.players.length < 2) return NextResponse.json({ ok: false, error: "至少需要2人" });
    initGame(room);
    await saveRoom(room);
    return NextResponse.json({ ok: true, seq: room.seq });
  }

  // ── Poll State ──
  if (action === "poll") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const pid = findPlayerIndex(room, body.playerId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    return NextResponse.json({ ok: true, view: playerView(room, pid) });
  }

  // ── Player Action ──
  if (action === "act") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const pid = findPlayerIndex(room, body.playerId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    const g = room.game;
    if (!g) return NextResponse.json({ ok: false, error: "游戏未开始" }, { status: 400 });

    const act = body.act as string;

    if (act === "discard") {
      const idx = body.idx as number;
      if (g.pendingBtns[pid]?.includes("discard") && g.cur === pid) {
        doDiscard(g, room, pid, idx);
      }
    } else if (act === "hu") {
      if (g.pendingBtns[pid]?.includes("hu")) {
        const tile = g.phase === "react" ? g.reactTile : null;
        declareHu(g, room, pid, tile, tile === null);
      }
    } else if (act === "peng") {
      if (g.pendingBtns[pid]?.includes("peng") && g.reactTile) {
        doPeng(g, room, pid, g.reactTile);
      }
    } else if (act === "gang") {
      if (g.pendingBtns[pid]?.includes("gang") && g.reactTile) {
        doGang(g, room, pid, g.reactTile, "discard");
      }
    } else if (act === "gang_self") {
      if (g.pendingBtns[pid]?.includes("gang_self")) {
        const gs = selfGangs(g.hands[pid], g.melds[pid]);
        if (gs.length) doGang(g, room, pid, gs[0], "self");
      }
    } else if (act === "chi") {
      if (g.pendingBtns[pid]?.includes("chi") && g.reactTile) {
        const opts = canChi(g.hands[pid], g.reactTile, g.reactFrom, pid);
        if (opts.length === 1) {
          doChi(g, room, pid, g.reactTile, opts[0]);
        } else if (opts.length > 1) {
          // need player to choose
          g.chiOpts = opts;
          g.chiPid = pid;
          g.pendingBtns[pid] = ["chi_choose"];
          room.seq++;
        }
      }
    } else if (act === "chi_choose") {
      const seqIdx = body.seqIdx as number;
      if (g.chiPid === pid && g.chiOpts && g.reactTile && seqIdx >= 0 && seqIdx < g.chiOpts.length) {
        doChi(g, room, pid, g.reactTile, g.chiOpts[seqIdx]);
        g.chiOpts = null;
        g.chiPid = -1;
      }
    } else if (act === "pass") {
      delete g.pendingBtns[pid];
      // check if all humans have passed
      const humanReactors = Object.keys(g.reactMap || {})
        .map(Number)
        .filter((k) => !room.players[k].isAI);
      const allPassed = humanReactors.every((k) => !g.pendingBtns[k]);
      if (allPassed) {
        // let AI react or move on
        aiResolveReactions(g, room, g.reactMap || {}, g.reactFrom, g.reactTile!);
      }
    }

    await saveRoom(room);
    return NextResponse.json({ ok: true, view: playerView(room, pid) });
  }

  // ── Next Round ──
  if (action === "next") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const pid = findPlayerIndex(room, body.playerId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    const g = room.game;
    if (!g || g.phase !== "ended") return NextResponse.json({ ok: false, error: "当前不能开新局" });
    // only host starts next round
    if (room.host !== body.playerId) {
      return NextResponse.json({ ok: false, error: "只有房主可以开始下一局" });
    }
    g.round++;
    g.result = null;
    initRound(room);
    await saveRoom(room);
    return NextResponse.json({ ok: true, view: playerView(room, pid) });
  }

  return NextResponse.json({ ok: false, error: "未知操作" }, { status: 400 });
}

function initRound(room: Room) {
  const oldDealer = room.game!.dealer;
  const g: GameState = {
    deck: shuffle(makeDeck()),
    di: 0,
    hands: [[], [], [], []],
    melds: [[], [], [], []],
    discs: [[], [], [], []],
    cur: 0,
    lastD: null,
    lastDpid: -1,
    round: room.game!.round,
    dealer: oldDealer,
    phase: "discard",
    reactMap: null,
    reactFrom: -1,
    reactTile: null,
    pendingBtns: {},
    chiOpts: null,
    chiPid: -1,
    result: null,
  };
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 13; j++) g.hands[i].push(g.deck[g.di++]);
  for (let i = 0; i < 4; i++) sortHand(g.hands[i]);
  room.game = g;
  room.seq++;
  startTurn(room, g.dealer);
}

export async function GET() {
  await cleanupRooms();
  if (hasDatabase()) {
    await ensureRoomDb();
    const rows = (await sql()`
      SELECT
        COUNT(*)::int AS rooms,
        COUNT(*) FILTER (WHERE data::jsonb ->> 'state' = 'playing')::int AS active_rooms
      FROM moon_mahjong_rooms
    `) as Array<{ rooms: number; active_rooms: number }>;
    return NextResponse.json({ ok: true, rooms: rows[0]?.rooms ?? 0, activeRooms: rows[0]?.active_rooms ?? 0 });
  }
  const rooms = Array.from(memoryRooms.values());
  return NextResponse.json({
    ok: true,
    rooms: rooms.length,
    activeRooms: rooms.filter((room) => room.game && room.game.phase !== "ended").length,
  });
}
