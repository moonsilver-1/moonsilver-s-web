import rawData from "./game_data.json";

export type Answer = "yes" | "no" | "unsure";
export type PropVal = -1 | 0 | 1;

type RawFeature = {
  field?: string;
  operator?: string;
  value?: unknown;
};

type RawQuestion = {
  question_id?: string;
  dimension?: string;
  text_zh?: string;
  text_en?: string;
  feature?: RawFeature;
  stage?: string;
  priority?: number;
  enabled?: boolean;
  question_tags?: unknown;
};

type RawEntity = Record<string, unknown> & {
  school_id?: string;
  enabled_for_game?: boolean;
  name_zh?: string | null;
  name_en?: string | null;
  aliases?: unknown;
  strength_tags?: unknown;
  combined_tags?: unknown;
  guess_priority_score?: number;
};

export type University = {
  id: string;
  name: {
    zh: string;
    en: string;
  };
  alias: string[];
  tags: string[];
  country: string;
  province: string;
  city: string;
  level: string;
  rank: string;
  props: Record<string, PropVal>;
  score: number;
};

export type Question = {
  id: string;
  sourceId: string;
  dimension: string;
  text: {
    zh: string;
    en: string;
  };
  feature: RawFeature;
  stage: "early" | "mid" | "late" | "unknown";
  priority: number;
  tags: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPath(value: unknown, path: string): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!isRecord(acc)) return undefined;
    return acc[key];
  }, value);
}

function toString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function normalize(value: unknown) {
  return toString(value).toLowerCase();
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => toString(item)).filter(Boolean);
  }

  const text = toString(value);
  if (!text) return [];
  return text
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFeatureValue(entity: RawEntity, field: string) {
  return field.includes(".") ? readPath(entity, field) : entity[field];
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function compareScalar(actual: unknown, expected: unknown) {
  if (typeof actual === "number" && typeof expected === "number") return actual === expected;
  if (typeof actual === "boolean" && typeof expected === "boolean") return actual === expected;
  return normalize(actual) === normalize(expected);
}

function compareArrays(actual: unknown, expected: unknown) {
  const actualValues = toStringArray(actual).map(normalize);
  const expectedValues = toStringArray(expected).map(normalize);
  return expectedValues.some((item) => actualValues.includes(item));
}

function isUniversityLike(entity: RawEntity) {
  const nameZh = toString(entity.name_zh);
  const nameEn = toString(entity.name_en);
  const combined = `${nameZh} ${nameEn} ${toString(entity.aliases)} ${toString(entity.combined_tags)}`.toLowerCase();

  if (combined.includes("\u5b66\u9662") || combined.includes("college") || combined.includes("institute")) {
    return false;
  }

  return combined.includes("\u5927\u5b66") || combined.includes("university");
}

function evaluateFeature(entity: RawEntity, feature?: RawFeature): PropVal {
  if (!feature?.field || !feature.operator) return 0;

  const actual = getFeatureValue(entity, feature.field);
  if (actual === undefined || actual === null) return 0;

  switch (feature.operator) {
    case "equals":
      return compareScalar(actual, feature.value) || compareArrays(actual, feature.value) ? 1 : -1;
    case "not_equals":
      return compareScalar(actual, feature.value) || compareArrays(actual, feature.value) ? -1 : 1;
    case "contains": {
      const needle = normalize(feature.value);
      const haystack = normalize(actual);
      if (!needle || !haystack) return 0;
      return haystack.includes(needle) ? 1 : -1;
    }
    case "contains_any": {
      const haystack = normalize(actual);
      const needles = toStringArray(feature.value).map(normalize);
      if (!haystack || needles.length === 0) return 0;
      return needles.some((item) => haystack.includes(item)) ? 1 : -1;
    }
    case "includes": {
      const actualItems = toStringArray(actual).map(normalize);
      const expected = normalize(feature.value);
      if (!actualItems.length || !expected) return 0;
      return actualItems.includes(expected) ? 1 : -1;
    }
    case "includes_any": {
      const actualItems = toStringArray(actual).map(normalize);
      const expectedItems = toStringArray(feature.value).map(normalize);
      if (!actualItems.length || expectedItems.length === 0) return 0;
      return expectedItems.some((item) => actualItems.includes(item)) ? 1 : -1;
    }
    case "between": {
      const numeric = typeof actual === "number" ? actual : Number(actual);
      const range = Array.isArray(feature.value)
        ? feature.value
        : isRecord(feature.value)
          ? [feature.value.min, feature.value.max]
          : [];
      const min = typeof range[0] === "number" ? range[0] : Number(range[0]);
      const max = typeof range[1] === "number" ? range[1] : Number(range[1]);
      if (!Number.isFinite(numeric) || !Number.isFinite(min) || !Number.isFinite(max)) return 0;
      return numeric >= min && numeric <= max ? 1 : -1;
    }
    case "exists":
      return hasValue(actual) ? 1 : -1;
    case "nested_equals": {
      const nested = readPath(entity, feature.field);
      return compareScalar(nested, feature.value) || compareArrays(nested, feature.value) ? 1 : -1;
    }
    default:
      return 0;
  }
}

function buildQuestionId(question: RawQuestion, index: number) {
  const base = question.question_id?.trim() || "question";
  return `${base}__${String(index + 1).padStart(3, "0")}`;
}

function isEntityLike(value: unknown): value is RawEntity {
  if (!isRecord(value)) return false;
  return (
    "school_id" in value ||
    "enabled_for_game" in value ||
    "entity_type" in value ||
    "name_zh" in value ||
    "name_en" in value
  );
}

function collectEntityArrays(value: unknown, seen = new Set<unknown>()): RawEntity[][] {
  if (!value || seen.has(value)) return [];
  if (typeof value !== "object") return [];
  seen.add(value);

  if (Array.isArray(value)) {
    const entities = value.filter(isEntityLike) as RawEntity[];
    return entities.length > 0 ? [entities] : [];
  }

  if (!isRecord(value)) return [];

  const arrays: RawEntity[][] = [];
  for (const item of Object.values(value)) {
    arrays.push(...collectEntityArrays(item, seen));
  }
  return arrays;
}

const rawQuestions = Array.isArray((rawData as Record<string, unknown>).question_bank)
  ? ((rawData as Record<string, unknown>).question_bank as RawQuestion[])
  : [];

const rawEntities = (() => {
  const root = rawData as Record<string, unknown>;
  const candidateRoots = [root.entities, root];
  const byId = new Map<string, RawEntity>();

  for (const candidate of candidateRoots) {
    for (const entity of collectEntityArrays(candidate).flat()) {
      const id = toString(entity.school_id);
      if (!id || byId.has(id)) continue;
      byId.set(id, entity);
    }
  }

  return [...byId.values()];
})();

export const gameMeta = {
  titleZh:
    toString(
      (rawData as Record<string, unknown>).system_overview &&
        isRecord((rawData as Record<string, unknown>).system_overview)
        ? (rawData as Record<string, unknown>).system_overview.name_zh
        : "",
    ) || "\u77e5\u6653\u4e00\u5207\u4e4b\u4eba",
  titleEn:
    toString(
      (rawData as Record<string, unknown>).system_overview &&
        isRecord((rawData as Record<string, unknown>).system_overview)
        ? (rawData as Record<string, unknown>).system_overview.name_en
        : "",
    ) || "The All-Knowing One",
  sloganZh:
    toString(
      (rawData as Record<string, unknown>).system_overview &&
        isRecord((rawData as Record<string, unknown>).system_overview)
        ? (rawData as Record<string, unknown>).system_overview.slogan_zh
        : "",
    ) || "\u8ba9\u6211\u731c\u731c\u4f60\u5fc3\u91cc\u60f3\u7684\u662f\u4ec0\u4e48\u5927\u5b66\u3002",
  sloganEn:
    toString(
      (rawData as Record<string, unknown>).system_overview &&
        isRecord((rawData as Record<string, unknown>).system_overview)
        ? (rawData as Record<string, unknown>).system_overview.slogan_en
        : "",
    ) || "Tell me your university and I will try to guess it.",
  descriptionZh:
    toString(
      (rawData as Record<string, unknown>).system_overview &&
        isRecord((rawData as Record<string, unknown>).system_overview)
        ? (rawData as Record<string, unknown>).system_overview.description_zh
        : "",
    ) || "\u4e00\u6b3e\u8f7b\u677e\u4f46\u5f88\u4f1a\u88c5\u6a21\u4f5c\u6837\u7684\u5927\u5b66\u731c\u6d4b\u6e38\u620f\u3002",
  descriptionEn:
    toString(
      (rawData as Record<string, unknown>).system_overview &&
        isRecord((rawData as Record<string, unknown>).system_overview)
        ? (rawData as Record<string, unknown>).system_overview.description_en
        : "",
    ) || "A playful university-guessing game built from a structured question bank.",
};

export const questions: Question[] = rawQuestions
  .filter((question) => question.enabled !== false && question.feature)
  .map((question, index) => ({
    id: buildQuestionId(question, index),
    sourceId: question.question_id?.trim() || buildQuestionId(question, index),
    dimension: question.dimension?.trim() || "GENERAL",
    text: {
      zh: question.text_zh?.trim() || question.text_en?.trim() || "\u672a\u77e5\u95ee\u9898",
      en: question.text_en?.trim() || question.text_zh?.trim() || "Unknown question",
    },
    feature: question.feature ?? {},
    stage:
      question.stage === "early" || question.stage === "mid" || question.stage === "late"
        ? question.stage
        : "unknown",
    priority: typeof question.priority === "number" ? question.priority : 0,
    tags: Array.isArray(question.question_tags) ? question.question_tags.map((tag) => toString(tag)).filter(Boolean) : [],
  }));

export const universities: University[] = rawEntities
  .filter((entity) => entity.enabled_for_game !== false && isUniversityLike(entity))
  .map((entity, index) => {
    const nameZh = toString(entity.name_zh) || toString(entity.name_en) || `University ${index + 1}`;
    const nameEn = toString(entity.name_en) || toString(entity.name_zh) || `University ${index + 1}`;
    const id = toString(entity.school_id) || `school-${index + 1}`;
    const alias = toStringArray(entity.aliases);
    const tags = [...toStringArray(entity.strength_tags), ...toStringArray(entity.combined_tags)];

    const props = Object.fromEntries(
      questions.map((question) => [question.id, evaluateFeature(entity, question.feature)]),
    );

    return {
      id,
      name: {
        zh: nameZh,
        en: nameEn,
      },
      alias,
      tags,
      country: toString(entity.country),
      province: toString(entity.province),
      city: toString(entity.city),
      level: toString(entity.level),
      rank: toString(entity.qs_rank_band) || toString(entity.soft_rank_cn_2026_category),
      props,
      score: typeof entity.guess_priority_score === "number" ? entity.guess_priority_score : 0,
    };
  });

export function findUniversityById(id: string) {
  return universities.find((university) => university.id === id) ?? null;
}

export function filterCompatibleUniversities(
  answers: Record<string, Answer>,
  pool: University[] = universities,
) {
  return pool.filter((university) =>
    Object.entries(answers).every(([questionId, answer]) => {
      const prop = university.props[questionId];
      if (answer === "unsure") return true;
      if (answer === "yes") return prop !== -1;
      return prop !== 1;
    }),
  );
}

export function scoreUniversity(university: University, answers: Record<string, Answer>) {
  let score = university.score;
  for (const [questionId, answer] of Object.entries(answers)) {
    const prop = university.props[questionId];
    if (prop === 0) continue;
    if (answer === "yes") score += prop === 1 ? 2 : -3;
    if (answer === "no") score += prop === -1 ? 2 : -3;
  }
  return score;
}

export function getCandidateRanking(answers: Record<string, Answer>) {
  return filterCompatibleUniversities(answers)
    .map((university) => ({
      university,
      score: scoreUniversity(university, answers),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.university.score - a.university.score ||
        a.university.name.zh.localeCompare(b.university.name.zh, "zh-Hans"),
    );
}

export const gameCounts = {
  universities: universities.length,
  questions: questions.length,
};
