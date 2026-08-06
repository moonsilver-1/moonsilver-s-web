import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import {
  type Stone,
  type Board,
  type Captured,
  type ScoreResult,
  createBoard,
  boardKey,
  play,
  autoMarkDeadStones,
  score,
  DEFAULT_KOMI,
} from "@/app/fun/weiqi/go-engine";

export const runtime = "nodejs";

/* ═══════════════════════════════════════════════════
   围棋 · 联机 API（服务端权威 + 轮询）
   ═══════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────

interface RoomPlayer {
  id: string;
  clientId?: string;
  name: string;
  color: Stone | null; // "B" | "W"，开局后分配
  online: boolean;
}

interface GameState {
  board: Board;
  turn: Stone;
  history: string[]; // 棋盘哈希历史（superko 用）
  moves: Array<{ x: number; y: number; color: Stone; pass: boolean }>;
  passes: number; // 连续 pass 计数
  captured: Captured; // 提子统计
  lastMove: { x: number; y: number; color: Stone; pass: boolean } | null;
  phase: "play" | "deadmark" | "ended";
  deadSet: string[]; // 确认的死子坐标 "x,y"
  deadConfirmed: { B: boolean; W: boolean }; // 双方是否确认死子
  undoRequest: { by: Stone; pending: boolean } | null;
  result: ScoreResult | null;
  resignedBy: Stone | null;
}

interface Room {
  code: string;
  players: RoomPlayer[];
  host: string;
  cfg: { size: number; komi: number };
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
    CREATE TABLE IF NOT EXISTS moon_weiqi_rooms (
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
    DELETE FROM moon_weiqi_rooms
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
    FROM moon_weiqi_rooms
    WHERE code = ${code}
    LIMIT 1
  `) as RoomRow[];
  const room = rows[0] ? hydrateRoom(rows[0]) : null;
  if (room) memoryRooms.set(room.code, room);
  return room;
}

async function saveRoom(room: Room) {
  memoryRooms.set(room.code, room);
  if (!hasDatabase()) return;
  await ensureRoomDb();
  const snapshot = cloneRoom(room);
  await sql()`
    INSERT INTO moon_weiqi_rooms (code, data, created_at, updated_at)
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
  await sql()`DELETE FROM moon_weiqi_rooms WHERE code = ${code}`;
}

async function deleteAllRooms() {
  memoryRooms.clear();
  if (!hasDatabase()) return 0;
  await ensureRoomDb();
  const rooms = (await sql()`
    DELETE FROM moon_weiqi_rooms RETURNING code
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

// ── Game Logic ─────────────────────────────────────

function newGame(size: number): GameState {
  return {
    board: createBoard(size),
    turn: "B",
    history: [boardKey(createBoard(size))],
    moves: [],
    passes: 0,
    captured: { B: 0, W: 0 },
    lastMove: null,
    phase: "play",
    deadSet: [],
    deadConfirmed: { B: false, W: false },
    undoRequest: null,
    result: null,
    resignedBy: null,
  };
}

function historySet(g: GameState): Set<string> {
  return new Set(g.history);
}

/** 落子或过手，返回错误信息（成功为 null） */
function applyMove(room: Room, g: GameState, color: Stone, move: { x: number; y: number } | { pass: true }): string | null {
  const opp = color === "B" ? "W" : "B";

  if ("pass" in move && move.pass) {
    g.moves.push({ x: -1, y: -1, color, pass: true });
    g.passes += 1;
    g.lastMove = { x: -1, y: -1, color, pass: true };
    if (g.passes >= 2) {
      enterDeadMark(g);
    } else {
      g.turn = opp;
    }
    room.seq++;
    return null;
  }

  if (!("pass" in move)) {
    const { x, y } = move;
    const result = play(g.board, x, y, color, historySet(g));
    if (!result.ok) return result.reason || "禁着点";

    g.board = result.board;
    g.history.push(boardKey(result.board));
    g.moves.push({ x, y, color, pass: false });
    if (result.captured.length) {
      // color 提走了对方子
      g.captured[color] += result.captured.length;
    }
    g.passes = 0;
    g.lastMove = { x, y, color, pass: false };
    g.turn = opp;
    g.deadConfirmed = { B: false, W: false };
    room.seq++;
    return null;
  }
  return "无效操作";
}

function enterDeadMark(g: GameState) {
  g.phase = "deadmark";
  g.deadConfirmed = { B: false, W: false };
  // 自动标记死子（启发式 + Benson）
  g.deadSet = Array.from(autoMarkDeadStones(g.board));
  // history 不变（死子标记阶段不落子）
}

/** 切换某个坐标的死子标记 */
function toggleDead(g: GameState, x: number, y: number) {
  const k = `${x},${y}`;
  // 只能标记有子的点
  if (!g.board[y][x]) return;
  const set = new Set(g.deadSet);
  if (set.has(k)) set.delete(k);
  else set.add(k);
  g.deadSet = Array.from(set);
  // 标记变动后，重置双方确认
  g.deadConfirmed = { B: false, W: false };
}

/** 双方都确认死子后结算 */
function settle(g: GameState, komi: number) {
  const deadSet = new Set(g.deadSet);
  g.result = score(g.board, deadSet, komi);
  g.phase = "ended";
}

function resumePlay(g: GameState) {
  // 打回对弈阶段，继续下，用于解决死活争议
  g.phase = "play";
  g.deadSet = [];
  g.deadConfirmed = { B: false, W: false };
  g.passes = 0;
  g.result = null;
}

function doUndo(room: Room, g: GameState) {
  // 回退最后一手实际落子（跳过末尾的 pass）
  let removed = false;
  while (g.moves.length > 0) {
    const last = g.moves[g.moves.length - 1];
    g.moves.pop();
    if (!last.pass) {
      removed = true;
      break;
    }
  }
  if (!removed) {
    room.seq++;
    return;
  }
  // 重建棋盘与历史（重放剩余棋步）
  const size = g.board.length;
  let board = createBoard(size);
  const history = [boardKey(board)];
  const captured: Captured = { B: 0, W: 0 };
  for (const m of g.moves) {
    if (m.pass) continue;
    const r = play(board, m.x, m.y, m.color, new Set(history));
    if (r.ok) {
      board = r.board; // play() 已包含落子与提子
      captured[m.color] += r.captured.length;
      history.push(boardKey(board));
    }
  }
  g.board = board;
  g.history = history;
  g.captured = captured;
  g.passes = 0;
  // 下一手 = 被撤销那手的颜色（轮到该方重下）
  g.turn = g.moves.length > 0
    ? (g.moves[g.moves.length - 1].color === "B" ? "W" : "B")
    : "B";
  const lm = g.moves[g.moves.length - 1];
  g.lastMove = lm && !lm.pass ? { ...lm, pass: false } : null;
  g.deadConfirmed = { B: false, W: false };
  g.deadSet = [];
  g.phase = "play";
  g.undoRequest = null;
  room.seq++;
}

// ── Player View ────────────────────────────────────

function playerView(room: Room, pid: number) {
  const g = room.game;
  if (!g) {
    return {
      phase: room.state,
      myColor: room.players[pid].color,
      players: room.players.map((p) => ({ name: p.name, color: p.color, online: p.online })),
      cfg: room.cfg,
    };
  }
  return {
    phase: g.phase,
    board: g.board,
    turn: g.turn,
    lastMove: g.lastMove,
    captured: g.captured,
    moves: g.moves,
    deadSet: g.deadSet,
    deadConfirmed: g.deadConfirmed,
    undoRequest: g.undoRequest,
    result: g.result,
    resignedBy: g.resignedBy,
    myColor: room.players[pid].color,
    players: room.players.map((p) => ({ name: p.name, color: p.color, online: p.online })),
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
    const size = body.size === 13 ? 13 : body.size === 9 ? 9 : 19;
    const komi = typeof body.komi === "number" ? body.komi : DEFAULT_KOMI[size];
    const code = genCode();
    const hostId = genId();
    const room: Room = {
      code,
      players: [{
        id: hostId,
        clientId: body.clientId,
        name: normalizeRoomPlayerName(body.name),
        color: null,
        online: true,
      }],
      host: hostId,
      cfg: { size, komi },
      createdAt: Date.now(),
      state: "waiting",
      seq: 0,
      game: null,
    };
    await saveRoom(room);
    return NextResponse.json({ ok: true, code, playerId: hostId, players: room.players, cfg: room.cfg });
  }

  // ── Join Room ──
  if (action === "join") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    if (room.state !== "waiting") return NextResponse.json({ ok: false, error: "游戏已开始" });
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    if (clientId) {
      const existing = room.players.find((p) => p.clientId === clientId);
      if (existing) {
        existing.online = true;
        await saveRoom(room);
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
    if (room.players.length >= 2) return NextResponse.json({ ok: false, error: "房间已满" });
    const pid = genId();
    room.players.push({
      id: pid,
      clientId: clientId || undefined,
      name: normalizeRoomPlayerName(body.name),
      color: null,
      online: true,
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
      pid = room.players.findIndex((p) => p.clientId === clientId);
    }
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    room.players[pid].online = true;
    await saveRoom(room);

    const payload = {
      ok: true,
      playerId: room.players[pid].id,
      isHost: room.host === room.players[pid].id,
      players: room.players,
      cfg: room.cfg,
      seq: room.seq,
      state: room.state,
    };
    if (room.state === "playing" && room.game) {
      return NextResponse.json({ ...payload, view: playerView(room, pid) });
    }
    return NextResponse.json(payload);
  }

  // ── Rename ──
  if (action === "rename") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const requestedPlayerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    let pid = requestedPlayerId ? findPlayerIndex(room, requestedPlayerId) : -1;
    if (pid < 0 && clientId) pid = room.players.findIndex((p) => p.clientId === clientId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    room.players[pid].name = normalizeRoomPlayerName(body.name);
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, players: room.players, playerId: room.players[pid].id, seq: room.seq });
  }

  // ── Leave ──
  if (action === "leave") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const requestedPlayerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    let pid = requestedPlayerId ? findPlayerIndex(room, requestedPlayerId) : -1;
    if (pid < 0 && clientId) pid = room.players.findIndex((p) => p.clientId === clientId);
    if (pid < 0) return NextResponse.json({ ok: true, removed: false });

    const leaving = room.players[pid];

    // 对局中离开 → 视为认输/弃权
    if (room.state === "playing" && room.game && room.game.phase !== "ended") {
      if (room.game.phase === "play" || room.game.phase === "deadmark") {
        const opp = room.players.find((p) => p.id !== leaving.id);
        room.game.resignedBy = leaving.color ?? null;
        room.game.result = {
          black: 0, white: 0, komi: room.cfg.komi,
          winner: opp?.color === "B" ? "B" : "W",
          diff: 0, blackStones: 0, whiteStones: 0,
          blackTerritory: 0, whiteTerritory: 0, deadCount: 0,
        };
        room.game.phase = "ended";
      }
    }

    room.players.splice(pid, 1);
    if (room.players.length === 0) {
      await deleteRoom(room.code);
      return NextResponse.json({ ok: true, removed: true, deleted: true });
    }
    if (room.host === leaving.id) {
      room.host = room.players[0].id;
    }
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, removed: true, deleted: false, host: room.host });
  }

  // ── Start Game ──
  if (action === "start") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    if (room.host !== body.playerId) return NextResponse.json({ ok: false, error: "只有房主可以开始" });
    if (room.players.length < 2) return NextResponse.json({ ok: false, error: "需要2人" });
    // 房主执黑，对方执白
    room.players[0].color = "B";
    room.players[1].color = "W";
    room.game = newGame(room.cfg.size);
    room.state = "playing";
    room.seq++;
    await saveRoom(room);
    return NextResponse.json({ ok: true, seq: room.seq });
  }

  // ── Poll ──
  if (action === "poll") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const pid = findPlayerIndex(room, body.playerId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    if (room.state === "waiting") {
      return NextResponse.json({ ok: true, phase: "waiting", players: room.players, cfg: room.cfg, seq: room.seq });
    }
    return NextResponse.json({ ok: true, view: playerView(room, pid) });
  }

  // ── 下面的操作都需要在游戏中 ──
  if (action === "act" || action === "pass" || action === "resign" ||
      action === "markDead" || action === "confirmDead" || action === "resumePlay" ||
      action === "undoRequest" || action === "undoRespond") {
    const room = await loadRoom(body.code);
    if (!room) return NextResponse.json({ ok: false, error: "房间不存在" }, { status: 404 });
    const pid = findPlayerIndex(room, body.playerId);
    if (pid < 0) return NextResponse.json({ ok: false, error: "不在房间中" }, { status: 403 });
    const g = room.game;
    if (!g) return NextResponse.json({ ok: false, error: "游戏未开始" }, { status: 400 });
    const myColor = room.players[pid].color;
    if (!myColor) return NextResponse.json({ ok: false, error: "未分配执子颜色" }, { status: 400 });

    // ── 落子 / 过手 ──
    if (action === "act" || action === "pass") {
      if (g.phase !== "play") return NextResponse.json({ ok: false, error: "当前不能落子" });
      if (g.turn !== myColor) return NextResponse.json({ ok: false, error: "还没轮到你" });
      // 若有未决悔棋请求，先要求响应（前端通常会先弹窗）
      const move = action === "pass"
        ? { pass: true } as const
        : { x: Number(body.x), y: Number(body.y) } as const;
      const err = applyMove(room, g, myColor, move);
      if (err) {
        await saveRoom(room);
        return NextResponse.json({ ok: false, error: err, view: playerView(room, pid) });
      }
      await saveRoom(room);
      return NextResponse.json({ ok: true, view: playerView(room, pid) });
    }

    // ── 认输 ──
    if (action === "resign") {
      if (g.phase === "ended") return NextResponse.json({ ok: false, error: "对局已结束" });
      const opp = myColor === "B" ? "W" : "B";
      g.resignedBy = myColor;
      g.result = {
        black: 0, white: 0, komi: room.cfg.komi,
        winner: opp,
        diff: 0, blackStones: 0, whiteStones: 0,
        blackTerritory: 0, whiteTerritory: 0, deadCount: 0,
      };
      g.phase = "ended";
      room.seq++;
      await saveRoom(room);
      return NextResponse.json({ ok: true, view: playerView(room, pid) });
    }

    // ── 标记死子（切换某点）──
    if (action === "markDead") {
      if (g.phase !== "deadmark") return NextResponse.json({ ok: false, error: "不在死子标记阶段" });
      toggleDead(g, Number(body.x), Number(body.y));
      room.seq++;
      await saveRoom(room);
      return NextResponse.json({ ok: true, view: playerView(room, pid) });
    }

    // ── 确认死子 ──
    if (action === "confirmDead") {
      if (g.phase !== "deadmark") return NextResponse.json({ ok: false, error: "不在死子标记阶段" });
      g.deadConfirmed[myColor] = true;
      if (g.deadConfirmed.B && g.deadConfirmed.W) {
        settle(g, room.cfg.komi);
      }
      room.seq++;
      await saveRoom(room);
      return NextResponse.json({ ok: true, view: playerView(room, pid) });
    }

    // ── 继续对弈（打回）──
    if (action === "resumePlay") {
      if (g.phase !== "deadmark") return NextResponse.json({ ok: false, error: "不在死子标记阶段" });
      resumePlay(g);
      room.seq++;
      await saveRoom(room);
      return NextResponse.json({ ok: true, view: playerView(room, pid) });
    }

    // ── 悔棋请求 ──
    if (action === "undoRequest") {
      if (g.phase !== "play") return NextResponse.json({ ok: false, error: "当前不能悔棋" });
      if (g.undoRequest?.pending) return NextResponse.json({ ok: false, error: "已有悔棋请求待响应" });
      g.undoRequest = { by: myColor, pending: true };
      room.seq++;
      await saveRoom(room);
      return NextResponse.json({ ok: true, view: playerView(room, pid) });
    }

    // ── 悔棋应答 ──
    if (action === "undoRespond") {
      if (!g.undoRequest?.pending) return NextResponse.json({ ok: false, error: "没有待响应的悔棋请求" });
      if (g.undoRequest.by === myColor) return NextResponse.json({ ok: false, error: "不能响应自己的请求" });
      const accept = Boolean(body.accept);
      if (accept) {
        doUndo(room, g);
      } else {
        g.undoRequest = null;
        room.seq++;
      }
      await saveRoom(room);
      return NextResponse.json({ ok: true, view: playerView(room, pid) });
    }
  }

  // ── Purge All Rooms (no admin gate, 同麻将风格可选) ──
  if (action === "purgeAll") {
    const deleted = await deleteAllRooms();
    return NextResponse.json({ ok: true, deleted });
  }

  return NextResponse.json({ ok: false, error: "未知操作" }, { status: 400 });
}

export async function GET() {
  await cleanupRooms();
  if (hasDatabase()) {
    await ensureRoomDb();
    const rows = (await sql()`
      SELECT
        COUNT(*)::int AS rooms,
        COUNT(*) FILTER (WHERE data::jsonb ->> 'state' = 'playing')::int AS active_rooms
      FROM moon_weiqi_rooms
    `) as Array<{ rooms: number; active_rooms: number }>;
    return NextResponse.json({ ok: true, rooms: rows[0]?.rooms ?? 0, activeRooms: rows[0]?.active_rooms ?? 0 });
  }
  const rooms = Array.from(memoryRooms.values());
  return NextResponse.json({
    ok: true,
    rooms: rooms.length,
    activeRooms: rooms.filter((r) => r.game && r.game.phase !== "ended").length,
  });
}
