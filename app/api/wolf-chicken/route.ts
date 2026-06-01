import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import {
  type GameState,
  type PlayerView,
  type ActionRequest,
  initGame,
  autoAssignCharacters,
  assignCharacter,
  startTurn,
  doJudge,
  useCard,
  useSkill,
  submitReact,
  discardToLimit,
  autoDiscard,
  aiAction,
  buildPlayerView,
} from "@/app/fun/wolf-chicken/game-core";
import { getCurrentAuthUser } from "@/app/lib/auth-current";

export const runtime = "nodejs";

/* ═══════════════════════════════════════════════════
   狼鸡杀 · 联机 API（服务端权威 + 轮询）
   ═══════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────

interface RoomPlayer {
  id: string;
  clientId?: string;
  name: string;
  isAI: boolean;
}

interface Room {
  code: string;
  players: RoomPlayer[];
  host: string;
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
    CREATE TABLE IF NOT EXISTS moon_wolfchicken_rooms (
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
    DELETE FROM moon_wolfchicken_rooms
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
    FROM moon_wolfchicken_rooms
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
    FROM moon_wolfchicken_rooms
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
    INSERT INTO moon_wolfchicken_rooms (code, data, created_at, updated_at)
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
    DELETE FROM moon_wolfchicken_rooms
    WHERE code = ${code}
  `;
}

async function deleteAllRooms() {
  memoryRooms.clear();
  if (!hasDatabase()) return 0;

  await ensureRoomDb();
  const rooms = (await sql()`
    DELETE FROM moon_wolfchicken_rooms
    RETURNING code
  `) as Array<{ code: string }>;
  return rooms.length;
}

function findPlayerIndex(room: Room, playerId: string) {
  return room.players.findIndex((p) => p.id === playerId);
}

function normalizeRoomPlayerName(name: unknown) {
  if (typeof name !== "string") return "玩家";
  const trimmed = name.trim();
  return trimmed || "玩家";
}

// ── Game Helpers ───────────────────────────────────

function initGameRoom(room: Room) {
  const names = room.players.map((p) => p.name);
  room.game = initGame(names);
  room.state = "playing";
  room.seq++;
}

function runAiIfNeeded(room: Room) {
  const g = room.game;
  if (!g) return;

  // auto-assign characters for AI
  if (g.phase === "character_select") {
    for (let i = 0; i < g.players.length; i++) {
      if (room.players[i]?.isAI && !g.players[i].character) {
        autoAssignCharacters(g);
      }
    }
  }

  // run AI actions during their turn
  if (g.phase === "playing" && !g.pendingReacts) {
    const pid = g.turn;
    if (room.players[pid]?.isAI && !g.players[pid].isDead) {
      const action = aiAction(g);
      if (action) {
        handleAction(room, pid, action);
      }
    }
  }

  // run AI reactions
  if (g.pendingReacts) {
    for (const pr of g.pendingReacts) {
      if (room.players[pr.playerId]?.isAI) {
        const action = aiAction(g, pr.playerId);
        if (action) {
          handleAction(room, pr.playerId, action);
        } else {
          // auto pass
          submitReact(g, pr.playerId, "pass");
        }
      }
    }
  }
}

function handleAction(room: Room, pid: number, action: ActionRequest): boolean {
  const g = room.game;
  if (!g) return false;

  if (action.type === "use_skill" && action.skillId) {
    const wasSelect = g.phase === "character_select";
    assignCharacter(g, pid, action.skillId);
    if (wasSelect && g.phase === "playing") {
      room.state = "playing";
      startTurn(g);
    }
    room.seq++;
    return true;
  }

  if (action.type === "use_card" && action.cardId) {
    const targets = action.targetIds || [];
    const ok = useCard(g, pid, action.cardId, targets);
    if (ok) room.seq++;
    return ok;
  }

  if (action.type === "use_skill" && action.skillId) {
    const ok = useSkill(g, pid, action.skillId, action.targetId, action.extra);
    if (ok) room.seq++;
    return ok;
  }

  if (action.type === "discard" && action.cardIds) {
    const ok = discardToLimit(g, pid, action.cardIds);
    if (ok) room.seq++;
    return ok;
  }

  if (action.type === "pass" && g.subPhase === "discard") {
    autoDiscard(g, pid);
    room.seq++;
    return true;
  }

  if (action.type === "pass" && g.subPhase === "play") {
    const p = g.players[pid];
    const limit = p.hp + g.handLimitBonus;
    if (p.hand.length <= limit) {
      g.subPhase = "discard";
      autoDiscard(g, pid);
    } else {
      g.subPhase = "discard";
    }
    room.seq++;
    return true;
  }

  if (action.type === "react") {
    const ok = submitReact(g, pid, action.reactType || "pass", action.extra);
    if (ok) room.seq++;
    return ok;
  }

  return false;
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
      }],
      host: hostId,
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
          seq: room.seq,
        });
      }
    }
    if (room.players.filter((p) => !p.isAI).length >= 8)
      return NextResponse.json({ ok: false, error: "房间已满" });
    const pid = genId();
    room.players.push({
      id: pid,
      clientId: clientId || undefined,
      name: normalizeRoomPlayerName(body.name),
      isAI: false,
    });
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, playerId: pid, players: room.players, seq: room.seq, isHost: false });
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
      seq: room.seq,
      state: room.state,
    };

    if (room.state === "playing" && room.game) {
      runAiIfNeeded(room);
      return NextResponse.json({ ...payload, view: buildPlayerView(room.game, pid, room.seq) });
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
    g.phase = "ended";
    g.winnerCamp = null;
    g.resultReason = "房主强制结束游戏";
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, view: buildPlayerView(room.game, findPlayerIndex(room, body.playerId), room.seq) });
  }

  // ── Abort All Games ──
  if (action === "abortAll") {
    const currentUser = await getCurrentAuthUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });
    }

    const rooms = await loadAllRooms();
    let affected = 0;

    for (const room of rooms) {
      if (!room.game) continue;
      room.game.phase = "ended";
      room.game.winnerCamp = null;
      room.game.resultReason = "管理员强制结束";
      affected++;
      await saveRoom(room);
    }

    return NextResponse.json({ ok: true, affected });
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
    if (room.players.length >= 8) return NextResponse.json({ ok: false, error: "房间已满" });
    const aiNames = ["AI·小狼", "AI·小鸡", "AI·黄鼠狼", "AI·波风", "AI·坚果", "AI·主播", "AI·码农"];
    const aiCount = room.players.filter((p) => p.isAI).length;
    room.players.push({
      id: "ai_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5),
      name: aiNames[aiCount] || "AI玩家",
      isAI: true,
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
    initGameRoom(room);
    await saveRoom(room);
    return NextResponse.json({ ok: true, seq: room.seq });
  }

  // ── Poll State ──
  if (action === "poll") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const pid = findPlayerIndex(room, body.playerId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });

    if (room.state === "playing" && room.game) {
      runAiIfNeeded(room);
      await saveRoom(room);
      return NextResponse.json({ ok: true, view: buildPlayerView(room.game, pid, room.seq) });
    }

    return NextResponse.json({ ok: true, players: room.players, state: room.state, seq: room.seq, host: room.host });
  }

  // ── Player Action ──
  if (action === "act") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const pid = findPlayerIndex(room, body.playerId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    const g = room.game;
    if (!g) return NextResponse.json({ ok: false, error: "游戏未开始" }, { status: 400 });

    const act: ActionRequest = {
      type: body.actType,
      playerId: pid,
      cardId: body.cardId,
      skillId: body.skillId,
      targetId: body.targetId,
      targetIds: body.targetIds,
      reactType: body.reactType,
      extra: body.extra,
    };

    handleAction(room, pid, act);
    runAiIfNeeded(room);
    await saveRoom(room);

    if (room.state === "playing" && room.game) {
      return NextResponse.json({ ok: true, view: buildPlayerView(room.game, pid, room.seq) });
    }
    return NextResponse.json({ ok: true });
  }

  // ── Next Round ──
  if (action === "next") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const pid = findPlayerIndex(room, body.playerId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    const g = room.game;
    if (!g || g.phase !== "ended") return NextResponse.json({ ok: false, error: "当前不能开新局" });
    if (room.host !== body.playerId) {
      return NextResponse.json({ ok: false, error: "只有房主可以开始下一局" });
    }
    room.game = null;
    room.state = "waiting";
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, state: room.state, seq: room.seq });
  }

  return NextResponse.json({ ok: false, error: "未知操作" }, { status: 400 });
}

// ── GET Handler ────────────────────────────────────

export async function GET() {
  await cleanupRooms();
  if (hasDatabase()) {
    await ensureRoomDb();
    const rows = (await sql()`
      SELECT
        COUNT(*)::int AS rooms,
        COUNT(*) FILTER (WHERE data::jsonb ->> 'state' = 'playing')::int AS active_rooms
      FROM moon_wolfchicken_rooms
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
