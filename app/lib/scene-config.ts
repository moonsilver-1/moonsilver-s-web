export type SceneKey = "autumn" | "spring" | "winter" | "starry";

export type ParticleConfig = {
  type: "leaf" | "petal" | "snowflake" | "star";
  count: number;
  colors: string[];
  sizeRange: [number, number];
  speedRange: [number, number];
  swayAmplitude: number;
  opacityRange: [number, number];
};

export type SceneConfig = {
  key: SceneKey;
  label: { zh: string; en: string };
  icon: string;
  particle: ParticleConfig;
};

export const SCENES: Record<SceneKey, SceneConfig> = {
  autumn: {
    key: "autumn",
    label: { zh: "秋", en: "Autumn" },
    icon: "\u{1F342}",
    particle: {
      type: "leaf",
      count: 5,
      colors: ["#d4956a", "#e2a97e", "#c78458"],
      sizeRange: [5, 10],
      speedRange: [0.2, 0.5],
      swayAmplitude: 0.4,
      opacityRange: [0.12, 0.3],
    },
  },
  spring: {
    key: "spring",
    label: { zh: "春", en: "Spring" },
    icon: "\u{1F338}",
    particle: {
      type: "petal",
      count: 6,
      colors: ["#f9a8d4", "#fbcfe8", "#fecdd3"],
      sizeRange: [4, 8],
      speedRange: [0.15, 0.35],
      swayAmplitude: 0.5,
      opacityRange: [0.1, 0.25],
    },
  },
  winter: {
    key: "winter",
    label: { zh: "冬", en: "Winter" },
    icon: "❄",
    particle: {
      type: "snowflake",
      count: 10,
      colors: ["#e0f2fe", "#bae6fd", "#ffffff"],
      sizeRange: [2, 5],
      speedRange: [0.1, 0.25],
      swayAmplitude: 0.3,
      opacityRange: [0.08, 0.2],
    },
  },
  starry: {
    key: "starry",
    label: { zh: "星空", en: "Starry" },
    icon: "✦",
    particle: {
      type: "star",
      count: 8,
      colors: ["#fef3c7", "#fde68a", "#fbbf24"],
      sizeRange: [1, 3],
      speedRange: [0.05, 0.12],
      swayAmplitude: 0.1,
      opacityRange: [0.1, 0.3],
    },
  },
};

export const SCENE_KEYS: SceneKey[] = ["autumn", "spring", "winter", "starry"];
export const DEFAULT_SCENE: SceneKey = "autumn";
