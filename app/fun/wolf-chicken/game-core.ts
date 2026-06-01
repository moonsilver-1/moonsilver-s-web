/* ═══════════════════════════════════════════════════
   狼鸡杀 · 游戏核心逻辑
   ═══════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────

export type Suit = "spade" | "heart" | "club" | "diamond";
export type CardType = "basic" | "scroll" | "equip";
export type BasicSubType = "bite" | "dodge" | "worm" | "stimulant";
export type ScrollSubType =
  | "draw2"      // 突然暴富
  | "steal"      // 顺手牵鸡
  | "dismantle"  // 过河拆鸡
  | "duel"       // 决斗
  | "aoe_dodge"  // 狼群入侵
  | "aoe_bite"   // 万鸡齐啄
  | "heal_all"   // 鸡圈结盟
  | "reveal"     // 五谷丰登
  | "borrow"     // 借刀咬人
  | "skip"       // 不思进取
  | "lightning"; // 天打雷劈
export type EquipSubType = "weapon" | "armor" | "horse_plus" | "horse_minus";
export type SubType = BasicSubType | ScrollSubType | EquipSubType;

export type Camp = "chicken_king" | "chicken" | "wolf" | "weasel";

export interface Card {
  id: string;
  type: CardType;
  subType: SubType;
  suit: Suit;
  rank: number; // 1-13
  name: string;
  desc: string;
}

export interface WeaponInfo {
  name: string;
  range: number;
  effect?: string;
}

export interface ArmorInfo {
  name: string;
  effect: string;
}

export interface Character {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  desc: string;
  isLimited: boolean; // 限定技
  isLocked: boolean;  // 锁定技
}

export interface PlayerState {
  id: number;
  name: string;
  camp: Camp | null;
  campRevealed: boolean;
  character: Character | null;
  hp: number;
  maxHp: number;
  hand: Card[];
  equips: Card[];
  isDead: boolean;
  // character-specific mutable state
  tokens: Record<string, number>;
  limitedUsed: Record<string, boolean>;
  // turn tracking
  damageDealtThisTurn: number;
  hasCausedDamageThisGame: boolean; // for 光合作用
}

export type GamePhase =
  | "character_select"
  | "playing"
  | "ended";

export type SubPhase =
  | "idle"           // between turns
  | "turn_start"
  | "judge"
  | "draw"
  | "play"
  | "discard"
  | "react"          // waiting for reactions (dodge etc.)
  | "dying"          // someone is dying
  | "turn_end";

export interface ReactOption {
  type: "dodge" | "bite" | "cancel" | "custom" | "pass";
  label: string;
  cardIds?: string[]; // which cards can be used
  skillId?: string;
  extra?: unknown;
}

export interface PendingReact {
  playerId: number;
  options: ReactOption[];
  deadline: number; // timestamp
}

export interface GameState {
  phase: GamePhase;
  subPhase: SubPhase;
  turn: number;       // whose turn it is
  round: number;
  deck: Card[];
  discardPile: Card[];
  players: PlayerState[];
  // active scroll effects on players
  delays: Record<number, Card[]>; // playerId -> [skip, lightning, ...]
  // reaction system
  pendingReacts: PendingReact[] | null;
  reactContext: ReactContext | null;
  // current play context
  currentCard: Card | null;
  currentSkill: string | null;
  currentTargets: number[];
  // turn flags
  extraDraw: number;     // bonus draw this turn
  handLimitBonus: number;
  cannotUseScroll: boolean;
  // damage tracking for 得分王 etc.
  damageEventsThisTurn: { source: number; target: number; amount: number }[];
  // log
  log: string[];
  // result
  winnerCamp: Camp | null;
  resultReason: string;
}

export interface ReactContext {
  type: "dodge" | "aoe_dodge" | "aoe_bite" | "duel_bite" | "lightning";
  sourceId: number;
  targetId: number;
  card: Card | null;
}

export interface ActionRequest {
  type: "use_card" | "use_skill" | "discard" | "react" | "pass" | "choose_target" | "choose_card";
  playerId: number;
  cardId?: string;
  skillId?: string;
  targetId?: number;
  targetIds?: number[];
  cardIds?: string[]; // for discard
  reactType?: string;
  extra?: unknown;
}

// ── Constants ──────────────────────────────────────

export const SUITS: Suit[] = ["spade", "heart", "club", "diamond"];
export const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  club: "♣",
  diamond: "♦",
};
export const SUIT_COLORS: Record<Suit, string> = {
  spade: "#1a1a1a",
  heart: "#c22",
  club: "#1a1a1a",
  diamond: "#c22",
};

export const RANK_NAMES: Record<number, string> = {
  1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
  8: "8", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K",
};

export const CAMP_NAMES: Record<Camp, string> = {
  chicken_king: "鸡王",
  chicken: "鸡仔",
  wolf: "狼",
  weasel: "黄鼠狼",
};

export const CAMP_EMOJIS: Record<Camp, string> = {
  chicken_king: "🐔👑",
  chicken: "🐤",
  wolf: "🐺",
  weasel: "🦨",
};

// ── Characters ─────────────────────────────────────

export const CHARACTERS: Character[] = [
  {
    id: "zhang_mingyue",
    name: "张明月",
    emoji: "🏃‍♂️",
    maxHp: 4,
    skills: [
      { id: "feileishen", name: "飞雷神", desc: "出牌阶段限一次，你使用【咬/啄】指定目标后，该角色不能使用【躲】。", isLimited: false, isLocked: false },
      { id: "xuanliwan", name: "螺旋丸", desc: "限定技，出牌阶段，对一名体力值大于你的角色造成2点伤害，然后你回复1点体力。", isLimited: true, isLocked: false },
    ],
  },
  {
    id: "lang_chenkai",
    name: "郎宸凯",
    emoji: "🏐",
    maxHp: 4,
    skills: [
      { id: "kousha", name: "扣杀", desc: "当你使用【咬/啄】指定目标后，可以额外选择一名距离为1的角色也成为此【咬/啄】的目标。", isLimited: false, isLocked: false },
      { id: "zuigui", name: "醉龟", desc: "锁定技，当你手牌数小于你的体力值时，你使用的【咬/啄】伤害+1且需要两张【躲】才能抵消。", isLimited: false, isLocked: true },
    ],
  },
  {
    id: "zhou_kaiqi",
    name: "周凯琦",
    emoji: "🏎️",
    maxHp: 3,
    skills: [
      { id: "drs", name: "DRS", desc: "摸牌阶段，你可以放弃摸牌，改为观看牌堆顶4张牌，获得其中任意张，其余以任意顺序放回牌堆底。", isLimited: false, isLocked: false },
      { id: "ganwei", name: "杆位", desc: "锁定技，其他角色计算与你的距离时，始终+1。", isLimited: false, isLocked: true },
    ],
  },
  {
    id: "cai_xialiang",
    name: "蔡夏亮",
    emoji: "📱",
    maxHp: 3,
    skills: [
      { id: "kaibo", name: "开播", desc: "锁定技，回合开始时进行一次判定：红色（sc爆米）本回合多摸1张且手牌上限+1；黑色（掉粉）本回合不能使用锦囊牌。", isLimited: false, isLocked: true },
      { id: "shangjian", name: "上舰", desc: "出牌阶段限一次，你可以将一张红色手牌交给一名其他角色，然后视为该角色对你使用了一张【虫】。", isLimited: false, isLocked: false },
    ],
  },
  {
    id: "wang_hanyu",
    name: "王瀚宇",
    emoji: "🌰",
    maxHp: 5,
    skills: [
      { id: "jianguoqiang", name: "坚果墙", desc: "锁定技，你每次受到的伤害最多为1点。", isLimited: false, isLocked: true },
      { id: "guanghezuoyong", name: "光合作用", desc: "回合结束阶段，若你本回合未造成过伤害，你回复1点体力。", isLimited: false, isLocked: false },
    ],
  },
  {
    id: "huang_juntao",
    name: "黄俊涛",
    emoji: "💰",
    maxHp: 3,
    skills: [
      { id: "ziben", name: "资本", desc: "锁定技，游戏开始时你获得3枚\"金币\"标记；每当你失去1枚\"金币\"时，你摸一张牌。", isLimited: false, isLocked: true },
      { id: "shoumai", name: "收买", desc: "出牌阶段限一次，弃置1枚\"金币\"，令一名其他角色选择：①交给你一张手牌；②本回合其非锁定技失效且不能使用【躲】。", isLimited: false, isLocked: false },
      { id: "zuokong", name: "做空", desc: "限定技，弃置所有\"金币\"，对一名其他角色造成等量的伤害。", isLimited: true, isLocked: false },
    ],
  },
  {
    id: "lin_jiong",
    name: "林炯",
    emoji: "🤖",
    maxHp: 3,
    skills: [
      { id: "bug", name: "Bug", desc: "出牌阶段限一次，选择一名其他角色。该角色本回合下一次使用牌或发动技能时，你可以为其重新指定目标。", isLimited: false, isLocked: false },
      { id: "debug", name: "Debug", desc: "当你成为其他角色使用的牌的目标时，你可以弃置一张手牌，令该角色重新选择目标（不能选你）。", isLimited: false, isLocked: false },
      { id: "vibe_coding", name: "Vibe Coding", desc: "锁定技，你不能成为【顺手牵鸡】和【过河拆鸡】的目标。", isLimited: false, isLocked: true },
    ],
  },
  {
    id: "zhang_hangning",
    name: "张航宁",
    emoji: "🏀",
    maxHp: 4,
    skills: [
      { id: "houtuibu", name: "后撤步", desc: "当你需要使用【躲】时，可以展示一张基本牌，视为使用了一张【躲】；然后本回合其他角色计算与你的距离+1。", isLimited: false, isLocked: false },
      { id: "zaofangui", name: "造犯规", desc: "当你受到伤害后，可以令伤害来源选择：①失去1点体力；②交给你一张装备牌。", isLimited: false, isLocked: false },
      { id: "defenwang", name: "得分王", desc: "锁定技，当你于一回合内累计造成第2点伤害后，你摸两张牌。", isLimited: false, isLocked: true },
    ],
  },
];

// ── Card Definitions ───────────────────────────────

const WEAPONS: { name: string; range: number; effect?: string }[] = [
  { name: "鸡爪", range: 2, effect: "你的红色【咬/啄】不可被【躲】抵消" },
  { name: "狼牙棒", range: 3 },
  { name: "狙击镜", range: 4 },
  { name: "火箭筒", range: 5, effect: "你使用【咬/啄】时可以额外指定一个目标" },
];

const ARMORS: { name: string; effect: string }[] = [
  { name: "鸡毛掸子", effect: "黑色的【咬/啄】对你无效" },
  { name: "狼皮甲", effect: "你受到的伤害-1" },
  { name: "龟壳", effect: "每回合限一次，【咬/啄】对你无效" },
];

let cardCounter = 0;
function nextId() {
  return `c-${++cardCounter}`;
}

function makeCard(type: CardType, subType: SubType, suit: Suit, rank: number, name: string, desc: string): Card {
  return { id: nextId(), type, subType, suit, rank, name, desc };
}

export function makeDeck(): Card[] {
  cardCounter = 0;
  const d: Card[] = [];

  // Basic cards
  // 咬/啄 ×24
  for (let i = 0; i < 24; i++) {
    const suit = SUITS[i % 4];
    const rank = (i % 13) + 1;
    d.push(makeCard("basic", "bite", suit, rank, "咬/啄", "出牌阶段，对一名攻击范围内的角色使用，造成1点伤害。"));
  }
  // 躲 ×16
  for (let i = 0; i < 16; i++) {
    const suit = SUITS[i % 4];
    const rank = (i % 13) + 1;
    d.push(makeCard("basic", "dodge", suit, rank, "躲", "当你成为【咬/啄】的目标时，打出此牌抵消之。"));
  }
  // 虫 ×12
  for (let i = 0; i < 12; i++) {
    const suit = SUITS[i % 4];
    const rank = (i % 13) + 1;
    d.push(makeCard("basic", "worm", suit, rank, "虫", "出牌阶段对自己使用，回复1点体力；或在角色濒死时使用，使其回复1点体力。"));
  }
  // 兴奋剂 ×4
  for (let i = 0; i < 4; i++) {
    const suit = SUITS[i % 4];
    const rank = (i % 13) + 1;
    d.push(makeCard("basic", "stimulant", suit, rank, "兴奋剂", "出牌阶段对自己使用，本回合下一张【咬/啄】伤害+1。"));
  }

  // Scroll cards
  const scrolls: { sub: ScrollSubType; name: string; desc: string; count: number }[] = [
    { sub: "draw2", name: "突然暴富", desc: "摸两张牌。", count: 6 },
    { sub: "steal", name: "顺手牵鸡", desc: "获得一名距离为1的角色一张手牌或装备。", count: 4 },
    { sub: "dismantle", name: "过河拆鸡", desc: "弃置一名其他角色一张手牌或装备。", count: 4 },
    { sub: "duel", name: "决斗", desc: "指定一名其他角色，双方轮流出【咬/啄】，先不出者受到1点伤害。", count: 3 },
    { sub: "aoe_dodge", name: "狼群入侵", desc: "所有其他角色需打出一张【躲】，否则受到1点伤害。", count: 3 },
    { sub: "aoe_bite", name: "万鸡齐啄", desc: "所有其他角色需打出一张【咬/啄】，否则受到1点伤害。", count: 3 },
    { sub: "heal_all", name: "鸡圈结盟", desc: "所有角色回复1点体力。", count: 1 },
    { sub: "reveal", name: "五谷丰登", desc: "亮出牌堆顶X张牌（X=存活角色数），每名角色选择一张获得。", count: 2 },
    { sub: "borrow", name: "借刀咬人", desc: "令一名有武器的角色对另一名角色使用【咬/啄】，否则获得其武器。", count: 2 },
    { sub: "skip", name: "不思进取", desc: "将牌放置于目标角色判定区，判定不为♥则跳过其下一出牌阶段。", count: 3 },
    { sub: "lightning", name: "天打雷劈", desc: "将牌放置于自己判定区，判定为♠2~9则受到3点伤害。", count: 1 },
  ];
  for (const s of scrolls) {
    for (let i = 0; i < s.count; i++) {
      const suit = SUITS[i % 4];
      const rank = (i % 13) + 1;
      d.push(makeCard("scroll", s.sub, suit, rank, s.name, s.desc));
    }
  }

  // Equipment
  for (const w of WEAPONS) {
    d.push(makeCard("equip", "weapon", "spade", 1, w.name, `攻击范围${w.range}${w.effect ? "，" + w.effect : ""}`));
  }
  for (const a of ARMORS) {
    d.push(makeCard("equip", "armor", "club", 2, a.name, a.effect));
  }
  for (let i = 0; i < 2; i++) {
    d.push(makeCard("equip", "horse_plus", "heart", 5, "+1马", "其他角色计算与你的距离时+1。"));
    d.push(makeCard("equip", "horse_minus", "diamond", 5, "-1马", "你计算与其他角色的距离时-1。"));
  }

  return d;
}

// ── Helpers ────────────────────────────────────────

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function distance(state: GameState, from: number, to: number): number {
  if (from === to) return 0;
  const n = state.players.length;
  // count only alive players for distance (clockwise)
  let d1 = 0;
  let i = from;
  while (true) {
    i = (i + 1) % n;
    if (i === to) break;
    if (!state.players[i].isDead) d1++;
  }
  // counter-clockwise
  let d2 = 0;
  i = from;
  while (true) {
    i = (i - 1 + n) % n;
    if (i === to) break;
    if (!state.players[i].isDead) d2++;
  }
  let d = Math.min(d1, d2) + 1; // +1 because distance = alive players between + 1
  // apply horse modifiers
  const fromPlayer = state.players[from];
  const toPlayer = state.players[to];
  const fromMinus = fromPlayer.equips.find((c) => c.subType === "horse_minus");
  const toPlus = toPlayer.equips.find((c) => c.subType === "horse_plus");
  if (fromMinus) d--;
  if (toPlus) d--;
  return Math.max(1, d);
}

export function attackRange(state: GameState, playerId: number): number {
  const p = state.players[playerId];
  const weapon = p.equips.find((c) => c.subType === "weapon");
  return weapon ? 4 : 1; // simplified: default range 1, weapon gives 4 for all weapons in MVP
}

export function canReach(state: GameState, from: number, to: number): boolean {
  return attackRange(state, from) >= distance(state, from, to);
}

export function isRedCard(card: Card): boolean {
  return card.suit === "heart" || card.suit === "diamond";
}

export function isBlackCard(card: Card): boolean {
  return card.suit === "spade" || card.suit === "club";
}

export function findCard(hand: Card[], cardId: string): Card | undefined {
  return hand.find((c) => c.id === cardId);
}

export function removeCard(hand: Card[], cardId: string): Card | null {
  const idx = hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return null;
  return hand.splice(idx, 1)[0];
}

export function drawCards(state: GameState, playerId: number, count: number): Card[] {
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discardPile.length === 0) break;
      // reshuffle
      state.deck = shuffle([...state.discardPile]);
      state.discardPile = [];
    }
    if (state.deck.length > 0) {
      drawn.push(state.deck.pop()!);
    }
  }
  state.players[playerId].hand.push(...drawn);
  return drawn;
}

export function log(state: GameState, msg: string) {
  state.log.unshift(msg);
  if (state.log.length > 50) state.log.pop();
}

// ── Camps ──────────────────────────────────────────

export function assignCamps(playerCount: number): Camp[] {
  const map: Record<number, Camp[]> = {
    2: ["chicken_king", "wolf"],
    3: ["chicken_king", "chicken", "wolf"],
    4: ["chicken_king", "chicken", "wolf", "wolf"],
    5: ["chicken_king", "chicken", "wolf", "wolf", "weasel"],
    6: ["chicken_king", "chicken", "chicken", "wolf", "wolf", "weasel"],
    7: ["chicken_king", "chicken", "chicken", "wolf", "wolf", "wolf", "weasel"],
    8: ["chicken_king", "chicken", "chicken", "chicken", "wolf", "wolf", "wolf", "weasel"],
  };
  const camps = map[playerCount] || map[8]!;
  return shuffle([...camps]);
}

// ── Game Init ──────────────────────────────────────

export function createPlayers(names: string[]): PlayerState[] {
  return names.map((name, i) => ({
    id: i,
    name,
    camp: null,
    campRevealed: false,
    character: null,
    hp: 4,
    maxHp: 4,
    hand: [],
    equips: [],
    isDead: false,
    tokens: {},
    limitedUsed: {},
    damageDealtThisTurn: 0,
    hasCausedDamageThisGame: false,
  }));
}

export function initGame(playerNames: string[]): GameState {
  const deck = shuffle(makeDeck());
  const players = createPlayers(playerNames);
  const camps = assignCamps(players.length);
  players.forEach((p, i) => {
    p.camp = camps[i];
    if (p.camp === "chicken_king") p.campRevealed = true;
  });

  const state: GameState = {
    phase: "character_select",
    subPhase: "idle",
    turn: 0,
    round: 1,
    deck,
    discardPile: [],
    players,
    delays: {},
    pendingReacts: null,
    reactContext: null,
    currentCard: null,
    currentSkill: null,
    currentTargets: [],
    extraDraw: 0,
    handLimitBonus: 0,
    cannotUseScroll: false,
    damageEventsThisTurn: [],
    log: [],
    winnerCamp: null,
    resultReason: "",
  };

  // deal initial 4 cards
  for (let i = 0; i < players.length; i++) {
    drawCards(state, i, 4);
  }

  log(state, "游戏开始！请选择角色。");
  return state;
}

export function assignCharacter(state: GameState, playerId: number, charId: string): boolean {
  if (state.phase !== "character_select") return false;
  const char = CHARACTERS.find((c) => c.id === charId);
  if (!char) return false;
  if (state.players.some((p) => p.character?.id === charId)) return false;
  const p = state.players[playerId];
  p.character = char;
  p.maxHp = char.maxHp;
  p.hp = char.maxHp;

  // init tokens
  if (charId === "huang_juntao") {
    p.tokens["coin"] = 3;
  }
  if (charId === "wang_hanyu") {
    p.maxHp = 5;
    p.hp = 5;
  }

  // check if all assigned
  if (state.players.every((p) => p.character !== null)) {
    state.phase = "playing";
    state.subPhase = "turn_start";
    state.turn = state.players.findIndex((p) => p.camp === "chicken_king");
    if (state.turn < 0) state.turn = 0;
    log(state, `角色选择完毕！${state.players[state.turn].name} 开始回合。`);
  }
  return true;
}

export function autoAssignCharacters(state: GameState) {
  const available = [...CHARACTERS];
  shuffle(available);
  for (let i = 0; i < state.players.length; i++) {
    if (!state.players[i].character) {
      assignCharacter(state, i, available[i].id);
    }
  }
}

// ── Turn Flow ──────────────────────────────────────

export function startTurn(state: GameState) {
  const pid = state.turn;
  const p = state.players[pid];
  if (p.isDead) {
    nextTurn(state);
    return;
  }

  state.subPhase = "turn_start";
  state.currentCard = null;
  state.currentSkill = null;
  state.currentTargets = [];
  state.extraDraw = 0;
  state.handLimitBonus = 0;
  state.cannotUseScroll = false;
  state.damageEventsThisTurn = [];
  p.damageDealtThisTurn = 0;

  // process delays (skip & lightning)
  if (state.delays[pid]?.length) {
    state.subPhase = "judge";
    log(state, `${p.name} 进行判定...`);
    return;
  }

  doDrawPhase(state);
}

export function doJudge(state: GameState) {
  const pid = state.turn;
  const delays = state.delays[pid] || [];
  if (!delays.length) {
    doDrawPhase(state);
    return;
  }

  const card = delays.shift()!;
  // draw a judge card
  let judge: Card;
  if (state.deck.length === 0) {
    state.deck = shuffle([...state.discardPile]);
    state.discardPile = [];
  }
  judge = state.deck.pop()!;
  log(state, `判定结果：${SUIT_SYMBOLS[judge.suit]}${RANK_NAMES[judge.rank]} ${judge.name}`);

  if (card.subType === "skip") {
    if (judge.suit !== "heart") {
      log(state, `${state.players[pid].name} 被【不思进取】跳过出牌阶段！`);
      (state.players[pid] as PlayerStateEx).skipPlay = true;
    } else {
      log(state, `【不思进取】失效。`);
    }
  } else if (card.subType === "lightning") {
    if (judge.suit === "spade" && judge.rank >= 2 && judge.rank <= 9) {
      log(state, `⚡ ${state.players[pid].name} 被天打雷劈！受到3点伤害！`);
      dealDamage(state, -1, pid, 3);
      if (!state.players[pid].isDead) {
        state.discardPile.push(card);
      }
    } else {
      log(state, `【天打雷劈】转移至下家。`);
      // move to next player
      let next = (pid + 1) % state.players.length;
      while (state.players[next].isDead) {
        next = (next + 1) % state.players.length;
      }
      if (!state.delays[next]) state.delays[next] = [];
      state.delays[next].push(card);
    }
  }

  state.discardPile.push(judge);
  state.delays[pid] = delays;

  if (!delays.length) {
    doDrawPhase(state);
  } else {
    log(state, "继续判定...");
  }
}

// helper type augmentation for skip flag
interface PlayerStateEx extends PlayerState {
  skipPlay?: boolean;
}

function getP(state: GameState, id: number): PlayerStateEx {
  return state.players[id] as PlayerStateEx;
}

function doDrawPhase(state: GameState) {
  const pid = state.turn;
  const p = getP(state, pid);
  state.subPhase = "draw";

  // 蔡夏亮 开播 (red = extra draw + hand limit)
  // handled by drawing a judge-like card or simple random
  if (p.character?.id === "cai_xialiang") {
    // simplified: coin flip
    const lucky = Math.random() > 0.5;
    if (lucky) {
      state.extraDraw += 1;
      state.handLimitBonus += 1;
      log(state, `🎰 ${p.name} 开播超级SC！手气爆棚！`);
    } else {
      state.cannotUseScroll = true;
      log(state, `📉 ${p.name} 开播掉粉了...本回合不能用锦囊。`);
    }
  }

  // 周凯琦 DRS
  if (p.character?.id === "zhou_kaiqi" && p.hand.length > 0) {
    // simplified: auto use DRS for AI, human gets option in UI
    // for now just normal draw
  }

  const drawCount = 2 + state.extraDraw;
  drawCards(state, pid, drawCount);
  log(state, `${p.name} 摸了 ${drawCount} 张牌。`);

  // clear skip flag
  p.skipPlay = false;
  state.subPhase = "play";
}

export function endTurn(state: GameState) {
  const pid = state.turn;
  const p = getP(state, pid);

  // 王瀚宇 光合作用
  if (p.character?.id === "wang_hanyu" && !p.hasCausedDamageThisGame && !p.isDead) {
    if (p.hp < p.maxHp) {
      p.hp++;
      log(state, `🌰 ${p.name} 光合作用回复1点体力！`);
    }
  }

  state.subPhase = "turn_end";
  checkWinCondition(state);
  if (state.phase === "ended") return;

  nextTurn(state);
}

function nextTurn(state: GameState) {
  let next = (state.turn + 1) % state.players.length;
  while (state.players[next].isDead) {
    next = (next + 1) % state.players.length;
  }
  if (next <= state.turn) state.round++;
  state.turn = next;
  startTurn(state);
}

// ── Damage & Death ─────────────────────────────────

export function dealDamage(state: GameState, sourceId: number, targetId: number, amount: number) {
  const target = state.players[targetId];
  if (target.isDead) return;

  let actual = amount;

  // 王瀚宇 坚果墙
  if (target.character?.id === "wang_hanyu") {
    actual = Math.min(1, actual);
  }

  // 狼皮甲
  const armor = target.equips.find((c) => c.subType === "armor" && c.name === "狼皮甲");
  if (armor && actual > 0) {
    actual = Math.max(0, actual - 1);
  }

  if (actual <= 0) {
    log(state, `${target.name} 抵挡了伤害！`);
    return;
  }

  target.hp -= actual;
  log(state, `${target.name} 受到 ${actual} 点伤害！（体力：${target.hp}/${target.maxHp}）`);

  if (sourceId >= 0) {
    const source = state.players[sourceId];
    source.damageDealtThisTurn += actual;
    source.hasCausedDamageThisGame = true;
    state.damageEventsThisTurn.push({ source: sourceId, target: targetId, amount: actual });

    // 张航宁 得分王
    if (source.character?.id === "zhang_hangning" && source.damageDealtThisTurn >= 2) {
      const already = (source.tokens["scored"] || 0) > 0;
      if (!already) {
        source.tokens["scored"] = 1;
        drawCards(state, sourceId, 2);
        log(state, `🏀 ${source.name} 得分王！连续得分，摸两张牌！`);
      }
    }
  }

  // 张航宁 造犯规
  if (target.character?.id === "zhang_hangning" && sourceId >= 0 && !target.isDead) {
    const source = state.players[sourceId];
    // simplified: auto lose 1 hp or give equip
    if (source.equips.length > 0 && Math.random() > 0.5) {
      const eq = source.equips.pop()!;
      target.equips.push(eq);
      log(state, `🏀 ${target.name} 造犯规！${source.name} 交出装备 ${eq.name}！`);
    } else if (source.hp > 1) {
      source.hp -= 1;
      log(state, `🏀 ${target.name} 造犯规！${source.name} 失去1点体力！`);
    }
  }

  if (target.hp <= 0) {
    enterDying(state, targetId);
  }
}

function enterDying(state: GameState, playerId: number) {
  state.subPhase = "dying";
  const p = state.players[playerId];
  log(state, `🚨 ${p.name} 进入濒死状态！需要【虫】来救命！`);

  // auto-save: check if has worm in hand
  const worm = p.hand.find((c) => c.subType === "worm");
  if (worm) {
    removeCard(p.hand, worm.id);
    state.discardPile.push(worm);
    p.hp = 1;
    log(state, `${p.name} 使用【虫】自救，回复到1点体力！`);
    state.subPhase = "play"; // resume
  } else {
    // check if others can save (simplified: no rescue for MVP)
    killPlayer(state, playerId);
  }
}

function killPlayer(state: GameState, playerId: number) {
  const p = state.players[playerId];
  p.isDead = true;
  p.campRevealed = true;
  p.hp = 0;
  state.discardPile.push(...p.hand, ...p.equips);
  p.hand = [];
  p.equips = [];
  log(state, `💀 ${p.name} 阵亡！身份：${CAMP_NAMES[p.camp!]} ${CAMP_EMOJIS[p.camp!]}`);

  // 击杀奖励
  // simplified: none for MVP

  checkWinCondition(state);
}

// ── Win Condition ──────────────────────────────────

function checkWinCondition(state: GameState) {
  const alive = state.players.filter((p) => !p.isDead);
  const aliveCamps = new Set(alive.map((p) => p.camp!));

  // chicken king dead -> wolf wins
  const kingDead = state.players.some((p) => p.camp === "chicken_king" && p.isDead);
  if (kingDead) {
    state.phase = "ended";
    state.winnerCamp = "wolf";
    state.resultReason = "鸡王阵亡，狼阵营获胜！";
    log(state, state.resultReason);
    return;
  }

  // all wolves dead -> chicken wins
  const wolvesAlive = alive.filter((p) => p.camp === "wolf");
  if (wolvesAlive.length === 0) {
    state.phase = "ended";
    state.winnerCamp = "chicken_king";
    state.resultReason = "狼全部阵亡，鸡阵营获胜！";
    log(state, state.resultReason);
    return;
  }

  // weasel solo win
  if (alive.length === 1 && alive[0].camp === "weasel") {
    state.phase = "ended";
    state.winnerCamp = "weasel";
    state.resultReason = "黄鼠狼独自存活，第三方获胜！";
    log(state, state.resultReason);
    return;
  }
}

// ── Card Usage ─────────────────────────────────────

export function canUseCard(state: GameState, playerId: number, card: Card): boolean {
  if (state.turn !== playerId) return false;
  if (state.subPhase !== "play") return false;
  if (state.pendingReacts) return false;

  const p = state.players[playerId];

  if (card.type === "scroll" && state.cannotUseScroll) return false;

  if (card.subType === "bite") {
    // must have targets in range
    return state.players.some((t, i) => i !== playerId && !t.isDead && canReach(state, playerId, i));
  }
  if (card.subType === "worm") {
    return p.hp < p.maxHp;
  }
  if (card.subType === "stimulant") {
    return true;
  }
  if (card.subType === "dodge") {
    return false; // dodge is reactive
  }

  // scrolls
  if (card.subType === "draw2" || card.subType === "heal_all") return true;
  if (card.subType === "steal") {
    return state.players.some((t, i) => i !== playerId && !t.isDead && distance(state, playerId, i) <= 1);
  }
  if (card.subType === "dismantle" || card.subType === "duel" || card.subType === "borrow" || card.subType === "skip") {
    return state.players.some((t, i) => i !== playerId && !t.isDead);
  }
  if (card.subType === "aoe_dodge" || card.subType === "aoe_bite") return true;
  if (card.subType === "reveal") return true;
  if (card.subType === "lightning") return true;

  return false;
}

export function useCard(state: GameState, playerId: number, cardId: string, targetIds: number[]): boolean {
  const p = state.players[playerId];
  const card = findCard(p.hand, cardId);
  if (!card) return false;
  if (!canUseCard(state, playerId, card)) return false;

  removeCard(p.hand, cardId);
  state.currentCard = card;

  if (card.subType === "bite") {
    // 郎宸凯 扣杀
    let targets = targetIds.filter((id) => id !== playerId && !state.players[id].isDead && canReach(state, playerId, id));
    if (p.character?.id === "lang_chenkai" && targets.length > 0) {
      // simplified: if has multiple valid targets, AI auto picks one extra
      // human will send multiple targets
    }
    if (targets.length === 0) {
      p.hand.push(card); // refund
      return false;
    }
    state.currentTargets = targets;
    // start reaction
    startBiteReaction(state, playerId, targets[0], card);
    return true;
  }

  if (card.subType === "worm") {
    p.hp = Math.min(p.maxHp, p.hp + 1);
    state.discardPile.push(card);
    log(state, `${p.name} 使用【虫】回复1点体力。`);
    return true;
  }

  if (card.subType === "stimulant") {
    p.tokens["stimulant"] = 1;
    state.discardPile.push(card);
    log(state, `${p.name} 使用【兴奋剂】，下一张【咬/啄】伤害+1！`);
    return true;
  }

  if (card.subType === "draw2") {
    drawCards(state, playerId, 2);
    state.discardPile.push(card);
    log(state, `${p.name} 使用【突然暴富】摸了两张牌！`);
    return true;
  }

  if (card.subType === "heal_all") {
    for (const pl of state.players) {
      if (!pl.isDead && pl.hp < pl.maxHp) {
        pl.hp++;
        log(state, `${pl.name} 回复1点体力。`);
      }
    }
    state.discardPile.push(card);
    log(state, `${p.name} 使用【鸡圈结盟】！全员回血！`);
    return true;
  }

  if (card.subType === "steal") {
    const tid = targetIds[0];
    if (tid === undefined || tid === playerId || state.players[tid].isDead) {
      p.hand.push(card);
      return false;
    }
    // simplified: steal random card
    const target = state.players[tid];
    const pool = [...target.hand, ...target.equips];
    if (pool.length === 0) {
      log(state, `${target.name} 没有牌可牵。`);
      state.discardPile.push(card);
      return true;
    }
    const stolen = pool[Math.floor(Math.random() * pool.length)];
    removeCard(target.hand, stolen.id);
    const eqIdx = target.equips.findIndex((e) => e.id === stolen.id);
    if (eqIdx >= 0) target.equips.splice(eqIdx, 1);
    p.hand.push(stolen);
    state.discardPile.push(card);
    log(state, `${p.name} 顺手牵走了 ${target.name} 的【${stolen.name}】！`);
    return true;
  }

  if (card.subType === "dismantle") {
    const tid = targetIds[0];
    if (tid === undefined || tid === playerId || state.players[tid].isDead) {
      p.hand.push(card);
      return false;
    }
    const target = state.players[tid];
    const pool = [...target.hand, ...target.equips];
    if (pool.length === 0) {
      log(state, `${target.name} 没有牌可拆。`);
      state.discardPile.push(card);
      return true;
    }
    const removed = pool[Math.floor(Math.random() * pool.length)];
    removeCard(target.hand, removed.id);
    const eqIdx = target.equips.findIndex((e) => e.id === removed.id);
    if (eqIdx >= 0) target.equips.splice(eqIdx, 1);
    state.discardPile.push(removed);
    state.discardPile.push(card);
    log(state, `${p.name} 过河拆掉了 ${target.name} 的【${removed.name}】！`);
    return true;
  }

  if (card.subType === "duel") {
    const tid = targetIds[0];
    if (tid === undefined || tid === playerId || state.players[tid].isDead) {
      p.hand.push(card);
      return false;
    }
    state.discardPile.push(card);
    log(state, `${p.name} 向 ${state.players[tid].name} 发起【决斗】！`);
    // simplified: target takes 1 damage immediately (MVP)
    dealDamage(state, playerId, tid, 1);
    return true;
  }

  if (card.subType === "aoe_dodge") {
    state.discardPile.push(card);
    log(state, `${p.name} 使用【狼群入侵】！`);
    startAoeDodgeReaction(state, playerId);
    return true;
  }

  if (card.subType === "aoe_bite") {
    state.discardPile.push(card);
    log(state, `${p.name} 使用【万鸡齐啄】！`);
    startAoeBiteReaction(state, playerId);
    return true;
  }

  if (card.subType === "skip") {
    const tid = targetIds[0];
    if (tid === undefined || tid === playerId || state.players[tid].isDead) {
      p.hand.push(card);
      return false;
    }
    if (!state.delays[tid]) state.delays[tid] = [];
    state.delays[tid].push(card);
    log(state, `${p.name} 对 ${state.players[tid].name} 使用了【不思进取】。`);
    return true;
  }

  if (card.subType === "lightning") {
    if (!state.delays[playerId]) state.delays[playerId] = [];
    state.delays[playerId].push(card);
    log(state, `${p.name} 召唤了【天打雷劈】！`);
    return true;
  }

  if (card.subType === "reveal") {
    state.discardPile.push(card);
    const aliveCount = state.players.filter((pl) => !pl.isDead).length;
    const revealed: Card[] = [];
    for (let i = 0; i < aliveCount; i++) {
      if (state.deck.length === 0) break;
      revealed.push(state.deck.pop()!);
    }
    log(state, `${p.name} 使用【五谷丰登】，亮出了${revealed.length}张牌！`);
    // simplified: current player gets first card, rest random to alive players
    let idx = 0;
    for (const pl of state.players) {
      if (pl.isDead) continue;
      if (revealed[idx]) {
        pl.hand.push(revealed[idx]);
        log(state, `${pl.name} 获得了【${revealed[idx].name}】。`);
        idx++;
      }
    }
    if (idx < revealed.length) state.discardPile.push(...revealed.slice(idx));
    return true;
  }

  if (card.subType === "borrow") {
    const tid = targetIds[0];
    const victimId = targetIds[1];
    if (tid === undefined || victimId === undefined || state.players[tid].isDead || state.players[victimId].isDead) {
      p.hand.push(card);
      return false;
    }
    const target = state.players[tid];
    const hasWeapon = target.equips.some((e) => e.subType === "weapon");
    if (!hasWeapon) {
      log(state, `${target.name} 没有武器，借刀失败。`);
      state.discardPile.push(card);
      return true;
    }
    // simplified: target bites victim, or lose weapon
    if (canReach(state, tid, victimId)) {
      dealDamage(state, tid, victimId, 1);
      log(state, `${target.name} 被迫咬了 ${state.players[victimId].name}！`);
    } else {
      const w = target.equips.find((e) => e.subType === "weapon")!;
      const wIdx = target.equips.findIndex((e) => e.subType === "weapon");
      target.equips.splice(wIdx, 1);
      p.hand.push(w);
      log(state, `${target.name} 够不着，${p.name} 拿走了 ${w.name}！`);
    }
    state.discardPile.push(card);
    return true;
  }

  if (card.type === "equip") {
    // unequip same slot
    const slot = card.subType;
    const existingIdx = p.equips.findIndex((e) => e.subType === slot);
    if (existingIdx >= 0) {
      const old = p.equips.splice(existingIdx, 1)[0];
      state.discardPile.push(old);
    }
    p.equips.push(card);
    log(state, `${p.name} 装备了【${card.name}】。`);
    return true;
  }

  // fallback
  state.discardPile.push(card);
  return true;
}

// ── Reaction System ────────────────────────────────

function startBiteReaction(state: GameState, sourceId: number, targetId: number, card: Card) {
  const target = state.players[targetId];
  state.reactContext = { type: "dodge", sourceId, targetId, card };

  const options: ReactOption[] = [];

  // 张明月 飞雷神 - 目标不能使用【躲】
  const feileishenActive = state.players[sourceId].character?.id === "zhang_mingyue" && state.currentSkill === "feileishen";

  // 张航宁 后撤步
  if (!feileishenActive) {
    const hasBasic = target.hand.some((c) => c.type === "basic");
    if (target.character?.id === "zhang_hangning" && hasBasic) {
      options.push({ type: "custom", label: "后撤步", skillId: "houtuibu" });
    }
  }

  // normal dodge
  if (!feileishenActive) {
    const dodges = target.hand.filter((c) => c.subType === "dodge");
    if (dodges.length > 0) {
      options.push({ type: "dodge", label: `出【躲】(${dodges.length}张)`, cardIds: dodges.map((c) => c.id) });
    }

    // 郎宸凯 醉龟 needs 2 dodges
    if (state.players[sourceId].character?.id === "lang_chenkai" && state.players[sourceId].hand.length < state.players[sourceId].hp) {
      if (dodges.length < 2) {
        // can't dodge, options empty
        options.length = 0;
      } else {
        options.push({ type: "dodge", label: `出2张【躲】`, cardIds: dodges.map((c) => c.id), extra: { needCount: 2 } });
      }
    }
  }

  if (options.length === 0) {
    // auto take damage
    let damage = 1;
    // stimulant buff
    if (state.players[sourceId].tokens["stimulant"]) {
      damage++;
      state.players[sourceId].tokens["stimulant"] = 0;
    }
    // 郎宸凯 醉龟 +1 damage
    if (state.players[sourceId].character?.id === "lang_chenkai" && state.players[sourceId].hand.length < state.players[sourceId].hp) {
      damage++;
    }

    state.discardPile.push(card);
    dealDamage(state, sourceId, targetId, damage);
    state.pendingReacts = null;
    state.reactContext = null;
    state.currentCard = null;
    state.currentSkill = null;
    return;
  }

  options.push({ type: "pass", label: "受击" });
  state.subPhase = "react";
  state.pendingReacts = [{ playerId: targetId, options, deadline: Date.now() + 15000 }];
}

function startAoeDodgeReaction(state: GameState, sourceId: number) {
  state.reactContext = { type: "aoe_dodge", sourceId, targetId: -1, card: null };
  const reacts: PendingReact[] = [];
  for (let i = 0; i < state.players.length; i++) {
    if (i === sourceId || state.players[i].isDead) continue;
    const dodges = state.players[i].hand.filter((c) => c.subType === "dodge");
    const options: ReactOption[] = [];
    if (dodges.length > 0) {
      options.push({ type: "dodge", label: `出【躲】`, cardIds: dodges.map((c) => c.id) });
    }
    // 张航宁 后撤步
    const hasBasic = state.players[i].hand.some((c) => c.type === "basic");
    if (state.players[i].character?.id === "zhang_hangning" && hasBasic) {
      options.push({ type: "custom", label: "后撤步", skillId: "houtuibu" });
    }
    options.push({ type: "pass", label: "受击" });
    reacts.push({ playerId: i, options, deadline: Date.now() + 15000 });
  }
  if (reacts.length > 0) {
    state.subPhase = "react";
  }
  state.pendingReacts = reacts;
}

function startAoeBiteReaction(state: GameState, sourceId: number) {
  state.reactContext = { type: "aoe_bite", sourceId, targetId: -1, card: null };
  const reacts: PendingReact[] = [];
  for (let i = 0; i < state.players.length; i++) {
    if (i === sourceId || state.players[i].isDead) continue;
    const bites = state.players[i].hand.filter((c) => c.subType === "bite");
    const options: ReactOption[] = [];
    if (bites.length > 0) {
      options.push({ type: "bite", label: `出【咬/啄】`, cardIds: bites.map((c) => c.id) });
    }
    options.push({ type: "pass", label: "受击" });
    reacts.push({ playerId: i, options, deadline: Date.now() + 15000 });
  }
  if (reacts.length > 0) {
    state.subPhase = "react";
  }
  state.pendingReacts = reacts;
}

export function submitReact(state: GameState, playerId: number, reactType: string, extra?: unknown): boolean {
  if (!state.pendingReacts) return false;
  const pr = state.pendingReacts.find((r) => r.playerId === playerId);
  if (!pr) return false;

  const p = state.players[playerId];

  if (reactType === "dodge" && state.reactContext) {
    const ctx = state.reactContext;
    if (ctx.type === "dodge") {
      const needCount = (extra as { needCount?: number })?.needCount || 1;
      const cardIds = (extra as { cardIds?: string[] })?.cardIds || [];
      const used: Card[] = [];
      for (const cid of cardIds.slice(0, needCount)) {
        const c = removeCard(p.hand, cid);
        if (c) used.push(c);
      }
      if (used.length < needCount) {
        p.hand.push(...used); // refund
        return false;
      }
      state.discardPile.push(...used);
      state.discardPile.push(state.currentCard!);
      log(state, `${p.name} 打出了【躲】！`);
      // 张航宁 后撤步 distance +1
      if ((extra as { skillId?: string })?.skillId === "houtuibu") {
        p.tokens["houtuibu"] = 1;
        log(state, `${p.name} 后撤步拉开距离！`);
      }
      state.pendingReacts = null;
      state.reactContext = null;
      state.currentCard = null;
      state.subPhase = "play";
      return true;
    }
    if (ctx.type === "aoe_dodge") {
      const cardIds = (extra as { cardIds?: string[] })?.cardIds || [];
      const c = removeCard(p.hand, cardIds[0]);
      if (!c) return false;
      state.discardPile.push(c);
      log(state, `${p.name} 打出了【躲】！`);
      state.pendingReacts = state.pendingReacts.filter((r) => r.playerId !== playerId);
      if (state.pendingReacts.length === 0) {
        state.reactContext = null;
        state.currentCard = null;
        state.currentSkill = null;
        state.subPhase = "play";
      }
      return true;
    }
  }

  if (reactType === "bite" && state.reactContext?.type === "aoe_bite") {
    const cardIds = (extra as { cardIds?: string[] })?.cardIds || [];
    const c = removeCard(p.hand, cardIds[0]);
    if (!c) return false;
    state.discardPile.push(c);
    log(state, `${p.name} 打出了【咬/啄】！`);
    state.pendingReacts = state.pendingReacts.filter((r) => r.playerId !== playerId);
    if (state.pendingReacts.length === 0) {
      state.reactContext = null;
      state.currentCard = null;
      state.currentSkill = null;
      state.subPhase = "play";
    }
    return true;
  }

  if (reactType === "pass") {
    if (state.reactContext?.type === "dodge") {
      let damage = 1;
      const sourceId = state.reactContext.sourceId;
      if (state.players[sourceId].tokens["stimulant"]) {
        damage++;
        state.players[sourceId].tokens["stimulant"] = 0;
      }
      if (state.players[sourceId].character?.id === "lang_chenkai" && state.players[sourceId].hand.length < state.players[sourceId].hp) {
        damage++;
      }
      state.discardPile.push(state.currentCard!);
      dealDamage(state, sourceId, playerId, damage);
      state.pendingReacts = null;
      state.reactContext = null;
      state.currentCard = null;
      state.currentSkill = null;
      state.subPhase = "play";
      return true;
    }
    if (state.reactContext?.type === "aoe_dodge") {
      dealDamage(state, state.reactContext.sourceId, playerId, 1);
      state.pendingReacts = state.pendingReacts.filter((r) => r.playerId !== playerId);
      if (state.pendingReacts.length === 0) {
        state.reactContext = null;
        state.currentCard = null;
        state.currentSkill = null;
        state.subPhase = "play";
      }
      return true;
    }
    if (state.reactContext?.type === "aoe_bite") {
      dealDamage(state, state.reactContext.sourceId, playerId, 1);
      state.pendingReacts = state.pendingReacts.filter((r) => r.playerId !== playerId);
      if (state.pendingReacts.length === 0) {
        state.reactContext = null;
        state.currentCard = null;
        state.currentSkill = null;
        state.subPhase = "play";
      }
      return true;
    }
  }

  if (reactType === "custom") {
    const skillId = (extra as { skillId?: string })?.skillId;
    if (skillId === "houtuibu" && state.reactContext?.type === "dodge") {
      const basicCard = p.hand.find((c) => c.type === "basic");
      if (basicCard) {
        p.tokens["houtuibu"] = 1;
        log(state, `${p.name} 后撤步！展示【${basicCard.name}】当【躲】！`);
        state.discardPile.push(state.currentCard!);
        state.pendingReacts = null;
        state.reactContext = null;
        state.currentCard = null;
        state.currentSkill = null;
        state.subPhase = "play";
        return true;
      }
    }
  }

  return false;
}

// ── Skill Usage ────────────────────────────────────

export function canUseSkill(state: GameState, playerId: number, skillId: string): boolean {
  if (state.turn !== playerId) return false;
  const p = state.players[playerId];
  const skill = p.character?.skills.find((s) => s.id === skillId);
  if (!skill) return false;
  if (skill.isLimited && p.limitedUsed[skillId]) return false;

  if (skillId === "xuanliwan") {
    // 螺旋丸: target with more hp
    return state.subPhase === "play" && state.players.some((t, i) => i !== playerId && !t.isDead && t.hp > p.hp);
  }
  if (skillId === "drs") {
    return state.subPhase === "draw";
  }
  if (skillId === "shangjian") {
    return state.subPhase === "play" && p.hand.some((c) => isRedCard(c));
  }
  if (skillId === "shoumai") {
    return state.subPhase === "play" && (p.tokens["coin"] || 0) > 0;
  }
  if (skillId === "zuokong") {
    return state.subPhase === "play" && (p.tokens["coin"] || 0) > 0;
  }
  if (skillId === "bug") {
    return state.subPhase === "play";
  }
  if (skillId === "debug") {
    return false; // reactive
  }
  if (skillId === "houtuibu") {
    return false; // reactive
  }
  if (skillId === "zaofangui") {
    return false; // reactive
  }
  if (skillId === "feileishen") {
    return state.subPhase === "play";
  }

  return false;
}

export function useSkill(state: GameState, playerId: number, skillId: string, targetId?: number, extra?: unknown): boolean {
  const p = state.players[playerId];
  if (!canUseSkill(state, playerId, skillId)) return false;

  if (skillId === "xuanliwan") {
    const tid = targetId ?? -1;
    if (tid < 0 || tid === playerId || state.players[tid].isDead || state.players[tid].hp <= p.hp) return false;
    p.limitedUsed[skillId] = true;
    dealDamage(state, playerId, tid, 2);
    if (!p.isDead && p.hp < p.maxHp) {
      p.hp++;
      log(state, `${p.name} 使用【螺旋丸】回复1点体力！`);
    }
    return true;
  }

  if (skillId === "shangjian") {
    const cardId = (extra as { cardId?: string })?.cardId;
    if (!cardId) return false;
    const card = removeCard(p.hand, cardId);
    if (!card || !isRedCard(card)) return false;
    const tid = targetId ?? -1;
    if (tid < 0 || tid === playerId || state.players[tid].isDead) {
      p.hand.push(card);
      return false;
    }
    state.players[tid].hand.push(card);
    log(state, `${p.name} 给 ${state.players[tid].name} 上了舰长！`);
    // treat as worm used on self
    if (p.hp < p.maxHp) {
      p.hp++;
      log(state, `${p.name} 回复1点体力！`);
    }
    return true;
  }

  if (skillId === "shoumai") {
    const tid = targetId ?? -1;
    if (tid < 0 || tid === playerId || state.players[tid].isDead) return false;
    if ((p.tokens["coin"] || 0) <= 0) return false;
    p.tokens["coin"]--;
    log(state, `${p.name} 使用【收买】，失去1金币！`);
    // simplified: target gives a card
    const target = state.players[tid];
    if (target.hand.length > 0) {
      const given = target.hand.pop()!;
      p.hand.push(given);
      log(state, `${target.name} 被收买，交出了【${given.name}】。`);
    } else {
      log(state, `${target.name} 没有手牌，技能被封印！`);
    }
    return true;
  }

  if (skillId === "zuokong") {
    const tid = targetId ?? -1;
    if (tid < 0 || tid === playerId || state.players[tid].isDead) return false;
    const coins = p.tokens["coin"] || 0;
    if (coins <= 0) return false;
    p.limitedUsed[skillId] = true;
    p.tokens["coin"] = 0;
    log(state, `${p.name} ALL IN【做空】！${coins}枚金币全部打出！`);
    dealDamage(state, playerId, tid, coins);
    // lose coin = draw card (黄俊涛 资本)
    drawCards(state, playerId, coins);
    return true;
  }

  if (skillId === "bug") {
    const tid = targetId ?? -1;
    if (tid < 0 || tid === playerId || state.players[tid].isDead) return false;
    p.tokens["bug_target"] = tid;
    log(state, `${p.name} 给 ${state.players[tid].name} 植入了Bug！`);
    return true;
  }

  if (skillId === "feileishen") {
    state.currentSkill = "feileishen";
    log(state, `${p.name} 发动了【飞雷神】！`);
    return true;
  }

  return false;
}

// ── Discard Phase ──────────────────────────────────

export function handLimit(state: GameState, playerId: number): number {
  return state.players[playerId].hp + state.handLimitBonus;
}

export function discardToLimit(state: GameState, playerId: number, cardIds: string[]): boolean {
  if (state.turn !== playerId) return false;
  if (state.subPhase !== "discard") return false;
  const p = state.players[playerId];
  const limit = handLimit(state, playerId);
  if (p.hand.length - cardIds.length > limit) return false;

  for (const cid of cardIds) {
    const c = removeCard(p.hand, cid);
    if (c) state.discardPile.push(c);
  }
  if (cardIds.length > 0) {
    log(state, `${p.name} 弃了 ${cardIds.length} 张牌。`);
  }
  endTurn(state);
  return true;
}

export function autoDiscard(state: GameState, playerId: number) {
  if (state.turn !== playerId) return;
  if (state.subPhase !== "discard") return;
  const p = state.players[playerId];
  const limit = handLimit(state, playerId);
  let discarded = 0;
  while (p.hand.length > limit) {
    const c = p.hand.pop()!;
    state.discardPile.push(c);
    discarded++;
  }
  if (discarded > 0) {
    log(state, `${p.name} 自动弃牌至 ${limit} 张。`);
  }
  endTurn(state);
}

// ── AI ─────────────────────────────────────────────

export function aiAction(state: GameState, forcedPid?: number): ActionRequest | null {
  const pid = forcedPid ?? state.turn;
  const p = state.players[pid];
  if (!p || p.isDead) return null;

  if (state.phase === "character_select") {
    // auto pick a random character
    const available = CHARACTERS.filter((c) => !state.players.some((pl) => pl.character?.id === c.id));
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      return { type: "use_skill", playerId: pid, skillId: pick.id };
    }
    return null;
  }

  if (state.subPhase === "draw") {
    return null; // auto draw
  }

  if (state.subPhase === "judge") {
    return null; // auto judge
  }

  if (state.subPhase === "discard" && state.turn === pid) {
    const limit = handLimit(state, pid);
    if (p.hand.length > limit) {
      const toDiscard = p.hand.slice(limit).map((c) => c.id);
      return { type: "discard", playerId: pid, cardIds: toDiscard };
    }
    return { type: "pass", playerId: pid };
  }

  if (state.subPhase === "play" && state.turn === pid) {
    // use stimulant if has bite
    const hasBite = p.hand.some((c) => c.subType === "bite");
    const stim = p.hand.find((c) => c.subType === "stimulant");
    if (stim && hasBite) {
      return { type: "use_card", playerId: pid, cardId: stim.id };
    }

    // use worm if low hp
    const worm = p.hand.find((c) => c.subType === "worm");
    if (worm && p.hp <= 2) {
      return { type: "use_card", playerId: pid, cardId: worm.id };
    }

    // use bite on enemies
    const bite = p.hand.find((c) => c.subType === "bite");
    if (bite) {
      // target enemies (different camp)
      const enemies = state.players
        .map((pl, i) => ({ i, pl }))
        .filter(({ i, pl }) => i !== pid && !pl.isDead && canReach(state, pid, i))
        .sort((a, b) => a.pl.hp - b.pl.hp); // target lowest hp
      if (enemies.length > 0) {
        const tid = enemies[0].i;
        // 郎宸凯 扣杀: try to hit extra
        const extraTargets: number[] = [];
        if (p.character?.id === "lang_chenkai") {
          const extra = state.players.findIndex((pl, i) => i !== pid && i !== tid && !pl.isDead && distance(state, pid, i) <= 1);
          if (extra >= 0) extraTargets.push(extra);
        }
        return { type: "use_card", playerId: pid, cardId: bite.id, targetIds: [tid, ...extraTargets] };
      }
    }

    // use draw2
    const draw2 = p.hand.find((c) => c.subType === "draw2");
    if (draw2) return { type: "use_card", playerId: pid, cardId: draw2.id };

    // equip weapons/armor
    const equip = p.hand.find((c) => c.type === "equip");
    if (equip) return { type: "use_card", playerId: pid, cardId: equip.id };

    // end turn
    return { type: "pass", playerId: pid };
  }

  if (state.subPhase === "react" && state.pendingReacts) {
    const pr = state.pendingReacts.find((r) => r.playerId === pid);
    if (!pr) return null;

    // AI prefers dodge if available
    const dodgeOpt = pr.options.find((o) => o.type === "dodge");
    if (dodgeOpt && dodgeOpt.cardIds && dodgeOpt.cardIds.length > 0) {
      return { type: "react", playerId: pid, reactType: "dodge", extra: { cardIds: [dodgeOpt.cardIds[0]] } };
    }
    // houtuibu
    const htOpt = pr.options.find((o) => o.skillId === "houtuibu");
    if (htOpt) {
      return { type: "react", playerId: pid, reactType: "custom", extra: { skillId: "houtuibu" } };
    }
    // pass
    return { type: "react", playerId: pid, reactType: "pass" };
  }

  return null;
}

// ── Player View (for multiplayer hiding secrets) ───

export interface PlayerView {
  phase: GamePhase;
  subPhase: SubPhase;
  myId: number; // original index
  myIndex: number; // remapped to 0
  turn: number; // remapped
  round: number;
  players: {
    id: number;
    name: string;
    camp: Camp | null;
    campRevealed: boolean;
    characterId: string | null;
    hp: number;
    maxHp: number;
    handCount: number;
    equips: Card[];
    isDead: boolean;
    tokens: Record<string, number>;
    limitedUsed: Record<string, boolean>;
  }[];
  myHand: Card[];
  myEquips: Card[];
  myTokens: Record<string, number>;
  myLimitedUsed: Record<string, boolean>;
  handLimitBonus: number;
  deckCount: number;
  discardCount: number;
  delays: Record<number, Card[]>;
  pendingReacts: PendingReact[] | null;
  reactContext: ReactContext | null;
  currentCard: Card | null;
  currentSkill: string | null;
  currentTargets: number[];
  log: string[];
  winnerCamp: Camp | null;
  resultReason: string;
  myActions: string[]; // available actions for this player
  targetableMap: Record<string, number[]>; // actionKey -> remapped targetIds
  chiOpts?: unknown; // not used
  seq: number;
}

export function buildPlayerView(state: GameState, playerId: number, seq: number): PlayerView {
  const n = state.players.length;
  // remap indices so requesting player is 0
  const remap = (i: number) => (i - playerId + n) % n;

  const myP = state.players[playerId];
  const players = state.players.map((p, i) => ({
    id: remap(i),
    name: p.name,
    camp: p.campRevealed ? p.camp : null,
    campRevealed: p.campRevealed,
    characterId: p.character?.id ?? null,
    hp: p.hp,
    maxHp: p.maxHp,
    handCount: p.hand.length,
    equips: p.equips,
    isDead: p.isDead,
    tokens: p.tokens,
    limitedUsed: p.limitedUsed,
  }));

  // reorder so my player is first
  const orderedPlayers = [];
  for (let i = 0; i < n; i++) {
    orderedPlayers.push(players[(i + playerId) % n]);
  }

  // available actions and targets
  const myActions: string[] = [];
  const targetableMap: Record<string, number[]> = {};
  if (state.phase === "character_select" && !myP.character) {
    myActions.push("select_character");
  }
  if (state.turn === playerId && state.subPhase === "play" && !state.pendingReacts) {
    myActions.push("play");
    // check usable cards
    for (const c of myP.hand) {
      if (canUseCard(state, playerId, c)) {
        myActions.push(`use_${c.id}`);
        // compute valid targets for this card
        if (c.subType === "bite") {
          targetableMap[`card_${c.id}`] = state.players
            .map((_, i) => i)
            .filter((i) => i !== playerId && !state.players[i].isDead && canReach(state, playerId, i))
            .map(remap);
        } else if (c.subType === "steal") {
          targetableMap[`card_${c.id}`] = state.players
            .map((_, i) => i)
            .filter((i) => i !== playerId && !state.players[i].isDead && distance(state, playerId, i) <= 1)
            .map(remap);
        } else if (["dismantle", "duel", "borrow", "skip"].includes(c.subType)) {
          targetableMap[`card_${c.id}`] = state.players
            .map((_, i) => i)
            .filter((i) => i !== playerId && !state.players[i].isDead)
            .map(remap);
        }
      }
    }
    // check usable skills
    if (myP.character) {
      for (const s of myP.character.skills) {
        if (canUseSkill(state, playerId, s.id)) {
          myActions.push(`skill_${s.id}`);
          if (s.id === "xuanliwan") {
            targetableMap[`skill_${s.id}`] = state.players
              .map((_, i) => i)
              .filter((i) => i !== playerId && !state.players[i].isDead && state.players[i].hp > myP.hp)
              .map(remap);
          } else if (["shangjian", "shoumai", "zuokong", "bug"].includes(s.id)) {
            targetableMap[`skill_${s.id}`] = state.players
              .map((_, i) => i)
              .filter((i) => i !== playerId && !state.players[i].isDead)
              .map(remap);
          }
        }
      }
    }
    myActions.push("end_turn");
  }
  if (state.turn === playerId && state.subPhase === "discard") {
    myActions.push("discard");
  }
  if (state.pendingReacts) {
    const pr = state.pendingReacts.find((r) => r.playerId === playerId);
    if (pr) {
      for (const opt of pr.options) {
        myActions.push(`react_${opt.type}`);
      }
    }
  }

  const remappedDelays: Record<number, Card[]> = {};
  for (const [k, v] of Object.entries(state.delays)) {
    remappedDelays[remap(Number(k))] = v;
  }

  return {
    phase: state.phase,
    subPhase: state.subPhase,
    myId: playerId,
    myIndex: 0,
    turn: remap(state.turn),
    round: state.round,
    players: orderedPlayers,
    myHand: myP.hand,
    myEquips: myP.equips,
    myTokens: myP.tokens,
    myLimitedUsed: myP.limitedUsed,
    handLimitBonus: state.handLimitBonus,
    deckCount: state.deck.length,
    discardCount: state.discardPile.length,
    delays: remappedDelays,
    pendingReacts: state.pendingReacts?.map((r) => ({ ...r, playerId: remap(r.playerId) })) ?? null,
    reactContext: state.reactContext ? {
      ...state.reactContext,
      sourceId: remap(state.reactContext.sourceId),
      targetId: state.reactContext.targetId >= 0 ? remap(state.reactContext.targetId) : -1,
    } : null,
    currentCard: state.currentCard,
    currentSkill: state.currentSkill,
    currentTargets: state.currentTargets.map(remap),
    log: state.log,
    winnerCamp: state.winnerCamp,
    resultReason: state.resultReason,
    myActions,
    targetableMap,
    seq,
  };
}
