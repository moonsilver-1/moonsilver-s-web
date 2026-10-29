"use client";

export type FarmState = {
  coins: number;
  lastCheckIn: string | null;
  streak: number;
  totalCheckIns: number;
  lastPetDay: string | null;
  petTotal: number;
};

const STORAGE_KEY = "farm-state-v1";
export const FARM_EVENT = "farm-state-changed";

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
};

export function readFarmState(): FarmState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<FarmState>;
    return {
      coins: Number(parsed.coins) || 0,
      lastCheckIn: typeof parsed.lastCheckIn === "string" ? parsed.lastCheckIn : null,
      streak: Number(parsed.streak) || 0,
      totalCheckIns: Number(parsed.totalCheckIns) || 0,
      lastPetDay: typeof parsed.lastPetDay === "string" ? parsed.lastPetDay : null,
      petTotal: Number(parsed.petTotal) || 0,
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
