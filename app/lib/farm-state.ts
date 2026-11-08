"use client";

export type CosmeticId = "strawberry" | "santa" | "grad" | "crown" | "bunny" | "tophat";

export type FarmState = {
  coins: number;
  lastCheckIn: string | null;
  streak: number;
  totalCheckIns: number;
  lastPetDay: string | null;
  petTotal: number;
  owned: CosmeticId[];
  equipped: CosmeticId | null;
};

const STORAGE_KEY = "farm-state-v1";
export const FARM_EVENT = "farm-state-changed";
export const SHOP_EVENT = "open-shop";

export function todayKey(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const DEFAULT_STATE: FarmState = {
  coins: 0,
  lastCheckIn: null,
  streak: 0,
  totalCheckIns: 0,
  lastPetDay: null,
  petTotal: 0,
  owned: [],
  equipped: null,
};

const COSMETIC_IDS = new Set<CosmeticId>([
  "strawberry",
  "santa",
  "grad",
  "crown",
  "bunny",
  "tophat",
]);

export function readFarmState(): FarmState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<FarmState>;
    const owned = Array.isArray(parsed.owned)
      ? parsed.owned.filter((id): id is CosmeticId => typeof id === "string" && COSMETIC_IDS.has(id as CosmeticId))
      : [];
    const equipped =
      typeof parsed.equipped === "string" && COSMETIC_IDS.has(parsed.equipped as CosmeticId)
        ? (parsed.equipped as CosmeticId)
        : null;
    return {
      coins: Number(parsed.coins) || 0,
      lastCheckIn: typeof parsed.lastCheckIn === "string" ? parsed.lastCheckIn : null,
      streak: Number(parsed.streak) || 0,
      totalCheckIns: Number(parsed.totalCheckIns) || 0,
      lastPetDay: typeof parsed.lastPetDay === "string" ? parsed.lastPetDay : null,
      petTotal: Number(parsed.petTotal) || 0,
      owned,
      equipped: owned.includes(equipped as CosmeticId) ? equipped : null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeFarmState(state: FarmState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(FARM_EVENT, { detail: state }));
}

export type CheckInResult = {
  ok: boolean;
  reason?: "already";
  reward: number;
  state: FarmState;
};

export function checkInToday(): CheckInResult {
  const state = readFarmState();
  const today = todayKey();
  if (state.lastCheckIn === today) {
    return { ok: false, reason: "already", reward: 0, state };
  }
  const streak = state.lastCheckIn === yesterdayKey() ? state.streak + 1 : 1;
  const reward = 20 + Math.min(streak, 7) * 5;
  const next: FarmState = {
    ...state,
    coins: state.coins + reward,
    lastCheckIn: today,
    streak,
    totalCheckIns: state.totalCheckIns + 1,
  };
  writeFarmState(next);
  return { ok: true, reward, state: next };
}

/** Pet the chicken: +1 coin once per day. */
export function petChicken(): { ok: boolean; state: FarmState } {
  const state = readFarmState();
  const today = todayKey();
  if (state.lastPetDay === today) {
    return { ok: false, state };
  }
  const next: FarmState = {
    ...state,
    coins: state.coins + 1,
    lastPetDay: today,
    petTotal: state.petTotal + 1,
  };
  writeFarmState(next);
  return { ok: true, state: next };
}

export type CosmeticInfo = {
  id: CosmeticId;
  name: { zh: string; en: string };
  price: number;
};

export const COSMETICS: CosmeticInfo[] = [
  { id: "strawberry", name: { zh: "草莓帽", en: "Strawberry Hat" }, price: 60 },
  { id: "santa", name: { zh: "圣诞帽", en: "Santa Hat" }, price: 80 },
  { id: "bunny", name: { zh: "兔耳帽", en: "Bunny Hood" }, price: 100 },
  { id: "grad", name: { zh: "学士帽", en: "Graduation Cap" }, price: 120 },
  { id: "tophat", name: { zh: "礼帽", en: "Top Hat" }, price: 150 },
  { id: "crown", name: { zh: "皇冠", en: "Crown" }, price: 200 },
];

export type BuyResult = {
  ok: boolean;
  reason?: "funds" | "owned" | "unknown";
  state: FarmState;
};

export function buyCosmetic(id: CosmeticId): BuyResult {
  const info = COSMETICS.find((c) => c.id === id);
  if (!info) return { ok: false, reason: "unknown", state: readFarmState() };
  const state = readFarmState();
  if (state.owned.includes(id)) return { ok: false, reason: "owned", state };
  if (state.coins < info.price) return { ok: false, reason: "funds", state };
  const next: FarmState = {
    ...state,
    coins: state.coins - info.price,
    owned: [...state.owned, id],
    equipped: id,
  };
  writeFarmState(next);
  return { ok: true, state: next };
}

export function equipCosmetic(id: CosmeticId | null): FarmState {
  const state = readFarmState();
  const equipped = id && state.owned.includes(id) ? id : null;
  const next: FarmState = { ...state, equipped };
  writeFarmState(next);
  return next;
}

export function openShop() {
  window.dispatchEvent(new CustomEvent(SHOP_EVENT));
}

export function subscribeFarm(listener: () => void): () => void {
  window.addEventListener(FARM_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(FARM_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export type CropStage = {
  stage: 0 | 1 | 2 | 3 | 4;
  label: { zh: string; en: string };
};

export function cropStage(totalCheckIns: number): CropStage {
  if (totalCheckIns >= 14) {
    return { stage: 4, label: { zh: "南瓜丰收", en: "Pumpkin Harvest" } };
  }
  if (totalCheckIns >= 9) {
    return { stage: 3, label: { zh: "结果", en: "Fruiting" } };
  }
  if (totalCheckIns >= 5) {
    return { stage: 2, label: { zh: "开花", en: "Flowering" } };
  }
  if (totalCheckIns >= 2) {
    return { stage: 1, label: { zh: "抽芽", en: "Sprout" } };
  }
  return { stage: 0, label: { zh: "种子", en: "Seed" } };
}

/** Deterministic daily weather from the date, so every visitor sees the same day. */
export type DailyWeather = "sunny" | "cloudy" | "rainy" | "windy";

export function dailyWeather(date = new Date()): DailyWeather {
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  // xorshift-ish deterministic hash
  let h = seed ^ 0x9e3779b9;
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  const pick = Math.abs(h) % 10;
  if (pick < 5) return "sunny";
  if (pick < 7) return "cloudy";
  if (pick < 9) return "windy";
  return "rainy";
}
