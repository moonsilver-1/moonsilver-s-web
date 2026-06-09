export type Answer = "yes" | "no" | "unsure";
export type PropVal = -1 | 0 | 1;

export type Phase = "intro" | "playing" | "guessing" | "result_correct" | "result_wrong" | "defeated";

export type GameState = {
  phase: Phase;
  answers: Record<string, Answer>;
  asked: string[];
  currentQuestionId: string | null;
  guessCount: number;
  excludedGuessIds: string[];
};

export type ScoredUni = {
  id: string;
  score: number;
};

type QuestionMeta = {
  id: string;
  priority: number;
  dimension?: string;
  tags?: string[];
  sourceId?: string;
  textZh?: string;
  textEn?: string;
  exclusiveGroup?: string;
  exclusiveValue?: string;
  mutexAfterPositiveAnswer?: boolean;
};

type GeoState = {
  branch: string;
  level: number;
  outsideChina: boolean;
};

type RankBounds = {
  min: number;
  max: number;
};

const MATCH_BONUS = 2;
const CONTRADICT_PENALTY = 3;
const GUESS_GAP = 4;
const MAX_QUESTIONS = 20;
const MAX_GUESSES = 3;

export function initGame(): GameState {
  return {
    phase: "intro",
    answers: {},
    asked: [],
    currentQuestionId: null,
    guessCount: 0,
    excludedGuessIds: [],
  };
}

function scoreOne(props: Record<string, PropVal>, answers: Record<string, Answer>): number {
  let score = 0;
  for (const [qId, answer] of Object.entries(answers)) {
    const val = props[qId];
    if (val === undefined || val === 0) continue;
    if (answer === "yes") {
      score += val === 1 ? MATCH_BONUS : val === -1 ? -CONTRADICT_PENALTY : 0;
    } else if (answer === "no") {
      score += val === -1 ? MATCH_BONUS : val === 1 ? -CONTRADICT_PENALTY : 0;
    }
  }
  return score;
}

export function scoreAll(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  answers: Record<string, Answer>,
): ScoredUni[] {
  return allUnis
    .map((u) => ({ id: u.id, score: scoreOne(u.props, answers) }))
    .sort((a, b) => b.score - a.score);
}

function isCompatible(props: Record<string, PropVal>, answers: Record<string, Answer>): boolean {
  for (const [qId, answer] of Object.entries(answers)) {
    const val = props[qId];
    if (answer === "unsure") continue;
    if (answer === "yes" && val === -1) return false;
    if (answer === "no" && val === 1) return false;
  }
  return true;
}

function getCompatibleUnis(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  answers: Record<string, Answer>,
  excludedGuessIds: string[] = [],
) {
  const excluded = new Set(excludedGuessIds);
  const compatible = allUnis.filter((u) => !excluded.has(u.id) && isCompatible(u.props, answers));
  return compatible.length > 0 ? compatible : allUnis;
}

function qText(question: QuestionMeta) {
  return `${question.id} ${question.sourceId ?? ""} ${question.dimension ?? ""} ${question.textZh ?? ""} ${question.textEn ?? ""} ${(question.tags ?? []).join(" ")}`.toLowerCase();
}

function questionFamily(question: QuestionMeta): string {
  const text = qText(question);
  if (/(qs|rank|ranking|reputation|world university|top\s*\d+)/.test(text)) return "rank";
  if (/(location|region|province|city|country|mainland|hong kong|macau|taiwan|overseas|domestic|abroad|district)/.test(text)) return "location";
  if (/(name|school|institution|university name|official name|campus)/.test(text)) return "name";
  if (/(major|subject|specialty|discipline|program|faculty|college of|school of)/.test(text)) return "major";
  return question.dimension?.trim().toLowerCase() || "general";
}

function rankThreshold(question: QuestionMeta): number | null {
  const text = qText(question);
  const patterns = [
    /(?:qs|top|rank(?:ing)?)\s*(?:前)?\s*(\d{2,4})/,
    /前\s*(\d{2,4})/,
    /top\s*(\d{2,4})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function isChinaDomesticQuestion(question: QuestionMeta): boolean {
  return /(?:\b211\b|\b985\b|双一流|一流学科|一本|二本|三本|北上广深|大陆|内地|高考|统招|省属|985工程|211工程|软科|中国大学排名|主榜|校友会|武书连|华东|华北|华南|华中|西南|西北|东北|北京|天津|河北|山西|内蒙古|辽宁|吉林|黑龙江|上海|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|西藏|陕西|甘肃|青海|宁夏|新疆|香港|澳门|台湾)/.test(qText(question));
}

function geoInfo(question: QuestionMeta): GeoState {
  const text = qText(question);

  if (/(usa|us|united states|america|new york|california|texas|florida|massachusetts|illinois)/.test(text)) {
    return { branch: "usa", level: 2, outsideChina: true };
  }
  if (/(canada)/.test(text)) {
    return { branch: "canada", level: 2, outsideChina: true };
  }
  if (/(uk|united kingdom|britain|england|scotland|wales|ireland|france|germany|italy|spain|netherlands|switzerland|europe|oxford|cambridge)/.test(text)) {
    return { branch: "europe", level: 2, outsideChina: true };
  }
  if (/(japan|korea|singapore|malaysia|thailand|vietnam|india|australia|new zealand|asia)/.test(text)) {
    return { branch: "asia", level: 2, outsideChina: true };
  }
  if (/(china|mainland|hong kong|macau|taiwan|beijing|shanghai|guangzhou|shenzhen|hangzhou|nanjing)/.test(text)) {
    return { branch: "china", level: 2, outsideChina: false };
  }
  if (/(north america|south america|latin america|america|oceania|africa)/.test(text)) {
    if (/(north america|america)/.test(text)) return { branch: "north_america", level: 1, outsideChina: true };
    if (/(south america|latin america)/.test(text)) return { branch: "south_america", level: 1, outsideChina: true };
    if (/(oceania)/.test(text)) return { branch: "oceania", level: 1, outsideChina: true };
    if (/(africa)/.test(text)) return { branch: "africa", level: 1, outsideChina: true };
  }

  return { branch: "", level: 0, outsideChina: false };
}

function currentGeoState(
  answers: Record<string, Answer>,
  questions: QuestionMeta[],
  askedSet: Set<string>,
): GeoState {
  let locked: GeoState = { branch: "", level: 0, outsideChina: false };

  for (const question of questions) {
    if (!askedSet.has(question.id)) continue;
    if (questionFamily(question) !== "location") continue;

    const g = geoInfo(question);
    const answer = answers[question.id];

    if (answer === "yes") {
      if (g.level > locked.level) locked = g;
      if (g.branch === "china") locked.outsideChina = false;
      if (g.branch && g.branch !== "china") locked.outsideChina = true;
    }

    if (answer === "no" && (g.branch === "china" || g.branch === "mainland")) {
      locked.outsideChina = true;
    }
  }

  return locked;
}

function currentRankCeiling(
  answers: Record<string, Answer>,
  questions: QuestionMeta[],
  askedSet: Set<string>,
): number | null {
  let ceiling: number | null = null;

  for (const question of questions) {
    if (!askedSet.has(question.id)) continue;
    if (answers[question.id] !== "yes") continue;
    if (questionFamily(question) !== "rank") continue;

    const threshold = rankThreshold(question);
    if (threshold === null) continue;
    ceiling = ceiling === null ? threshold : Math.min(ceiling, threshold);
  }

  return ceiling;
}

function pickQuestion(
  questions: QuestionMeta[],
  candidateUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  askedSet: Set<string>,
  predicate: (question: QuestionMeta) => boolean,
): string | null {
  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const question of questions) {
    if (askedSet.has(question.id)) continue;
    if (!predicate(question)) continue;

    let yesCount = 0;
    let noCount = 0;
    for (const uni of candidateUnis) {
      const value = uni.props[question.id];
      if (value === 1) yesCount++;
      else if (value === -1) noCount++;
    }

    const score = Math.min(yesCount, noCount) * 10 + question.priority * 0.01;
    if (score > bestScore) {
      bestScore = score;
      bestId = question.id;
    }
  }

  return bestId;
}

export function selectNextQuestion(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  answers: Record<string, Answer>,
  askedSet: Set<string>,
  questions: QuestionMeta[],
  excludedGuessIds: string[] = [],
): string | null {
  const viableUnis = getCompatibleUnis(allUnis, answers, excludedGuessIds);
  const scored = scoreAll(viableUnis, answers);
  const candidateIds = new Set(scored.filter((s) => s.score >= 0).slice(0, 30).map((s) => s.id));
  const candidateUnis = viableUnis.filter((u) => candidateIds.has(u.id));
  if (candidateUnis.length <= 1) return null;

  const locationQuestion = selectLocationQuestion(questions, candidateUnis, askedSet, answers);
  if (locationQuestion) return locationQuestion;

  const rankQuestion = selectRankQuestion(questions, candidateUnis, askedSet, answers);
  if (rankQuestion) return rankQuestion;

  if (candidateUnis.length > 8) {
    const nextMajor = pickQuestion(questions, candidateUnis, askedSet, (q) => questionFamily(q) === "major");
    if (nextMajor) return nextMajor;
  }

  return pickQuestion(questions, candidateUnis, askedSet, () => true);
}

function askedSetHasFamily(askedSet: Set<string>, questions: QuestionMeta[], family: string) {
  for (const question of questions) {
    if (!askedSet.has(question.id)) continue;
    if (questionFamily(question) === family) return true;
  }
  return false;
}

function findQuestionById(questions: QuestionMeta[], askedSet: Set<string>, questionId: string): string | null {
  for (const question of questions) {
    if (question.id !== questionId) continue;
    if (askedSet.has(question.id)) return null;
    return question.id;
  }
  return null;
}

function rankThresholdV2(question: QuestionMeta): number | null {
  const source = `${question.sourceId ?? ""} ${question.id}`.toLowerCase();
  const exactTop = source.match(/\bq_qs_top(\d{1,4})\b/);
  if (exactTop) return Number(exactTop[1]);

  const ranged = source.match(/\bq_qs_(\d{1,4})_(\d{1,4})\b/);
  if (ranged) return Number(ranged[2]);

  const broad = source.match(/\bq_qs(\d{3,4})\b/);
  if (broad) return Number(broad[1]);

  return null;
}

function questionExclusiveGroup(question: QuestionMeta): string | null {
  if (question.id === "q_region_mainland" || question.id === "q_region_hmt") return "china_root_region";
  return question.exclusiveGroup?.trim() || null;
}

function questionExclusiveValue(question: QuestionMeta): string | null {
  if (question.id === "q_region_mainland") return "mainland";
  if (question.id === "q_region_hmt") return "hmt";
  return question.exclusiveValue?.trim() || null;
}

function buildExclusiveLocks(
  answers: Record<string, Answer>,
  questions: QuestionMeta[],
  askedSet: Set<string>,
): Map<string, string> {
  const locks = new Map<string, string>();

  for (const question of questions) {
    if (!askedSet.has(question.id)) continue;
    if (answers[question.id] !== "yes") continue;

    const group = questionExclusiveGroup(question);
    const value = questionExclusiveValue(question);
    if (!group || !value) continue;
    locks.set(group, value);
  }

  return locks;
}

function questionBlockedByLocks(question: QuestionMeta, locks: Map<string, string>): boolean {
  const group = questionExclusiveGroup(question);
  const value = questionExclusiveValue(question);
  if (!group || !value) return false;
  const lockedValue = locks.get(group);
  return lockedValue !== undefined && lockedValue !== value;
}

function hasPositiveAnswerForGroup(
  answers: Record<string, Answer>,
  questions: QuestionMeta[],
  askedSet: Set<string>,
  group: string,
): boolean {
  for (const question of questions) {
    if (!askedSet.has(question.id)) continue;
    if (answers[question.id] !== "yes") continue;
    if (questionExclusiveGroup(question) !== group) continue;
    return true;
  }
  return false;
}

function currentRankBoundsV2(
  answers: Record<string, Answer>,
  questions: QuestionMeta[],
  askedSet: Set<string>,
): RankBounds {
  let min = 1;
  let max = Number.POSITIVE_INFINITY;

  for (const question of questions) {
    if (!askedSet.has(question.id)) continue;

    const threshold = rankThresholdV2(question);
    if (threshold === null) continue;

    const answer = answers[question.id];
    if (answer === "yes") {
      max = Math.min(max, threshold);
    } else if (answer === "no") {
      min = Math.max(min, threshold + 1);
    }
  }

  return { min, max };
}

function selectLocationQuestion(
  questions: QuestionMeta[],
  candidateUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  askedSet: Set<string>,
  answers: Record<string, Answer>,
): string | null {
  const locks = buildExclusiveLocks(answers, questions, askedSet);
  const mainland = answers.q_region_mainland;
  const hmt = answers.q_region_hmt;

  if (!askedSet.has("q_region_mainland")) {
    return findQuestionById(questions, askedSet, "q_region_mainland");
  }

  if (mainland === "yes") {
    const areaDone = hasPositiveAnswerForGroup(answers, questions, askedSet, "china_area");
    if (!areaDone) {
      const nextArea = pickQuestion(questions, candidateUnis, askedSet, (q) => {
        if (questionFamily(q) !== "location") return false;
        if (questionExclusiveGroup(q) !== "china_area") return false;
        if (questionBlockedByLocks(q, locks)) return false;
        return true;
      });
      if (nextArea) return nextArea;
    }

    const provinceDone = hasPositiveAnswerForGroup(answers, questions, askedSet, "province");
    if (!provinceDone) {
      const nextProvince = pickQuestion(questions, candidateUnis, askedSet, (q) => {
        if (questionFamily(q) !== "location") return false;
        if (questionExclusiveGroup(q) !== "province") return false;
        if (questionBlockedByLocks(q, locks)) return false;
        return true;
      });
      if (nextProvince) return nextProvince;
    }

    return null;
  }

  if (mainland === "no") {
    if (!askedSet.has("q_region_hmt")) {
      return findQuestionById(questions, askedSet, "q_region_hmt");
    }

    if (hmt === "yes") return null;

    const worldRegion = pickQuestion(questions, candidateUnis, askedSet, (q) => {
      if (questionFamily(q) !== "location") return false;
      if (questionExclusiveGroup(q) !== "region_world") return false;
      if (questionBlockedByLocks(q, locks)) return false;
      return true;
    });
    if (worldRegion) return worldRegion;
  }

  return null;
}

function selectRankQuestion(
  questions: QuestionMeta[],
  candidateUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  askedSet: Set<string>,
  answers: Record<string, Answer>,
): string | null {
  const locks = buildExclusiveLocks(answers, questions, askedSet);
  const bounds = currentRankBoundsV2(answers, questions, askedSet);
  const preferredThresholds = [1000, 500, 200, 100, 50, 10];

  if (bounds.max <= 10) return null;

  for (const threshold of preferredThresholds) {
    const next = pickQuestion(questions, candidateUnis, askedSet, (q) => {
      if (questionFamily(q) !== "rank") return false;
      if (questionBlockedByLocks(q, locks)) return false;
      const qThreshold = rankThresholdV2(q);
      if (qThreshold !== threshold) return false;
      if (qThreshold < bounds.min) return false;
      if (qThreshold >= bounds.max) return false;
      return true;
    });
    if (next) return next;
  }

  return pickQuestion(questions, candidateUnis, askedSet, (q) => {
    if (questionFamily(q) !== "rank") return false;
    if (questionBlockedByLocks(q, locks)) return false;
    const qThreshold = rankThresholdV2(q);
    if (qThreshold === null) return false;
    if (qThreshold < bounds.min) return false;
    if (qThreshold >= bounds.max) return false;
    return true;
  });
}

export function shouldGuess(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  answers: Record<string, Answer>,
  askedCount: number,
  excludedGuessIds: string[] = [],
): boolean {
  const viableUnis = getCompatibleUnis(allUnis, answers, excludedGuessIds);
  const scored = scoreAll(viableUnis, answers);
  if (scored.length < 2) return true;
  if (scored[0].score - scored[1].score >= GUESS_GAP) return true;
  if (askedCount >= MAX_QUESTIONS) return true;
  return false;
}

export type ProcessResult = {
  state: GameState;
  guessId: string | null;
};

export function processAnswer(
  prevState: GameState,
  answer: Answer,
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  questions: QuestionMeta[],
  excludedGuessIds: string[] = [],
): ProcessResult {
  const qId = prevState.currentQuestionId!;
  const answers = { ...prevState.answers, [qId]: answer };
  const asked = [...prevState.asked, qId];
  const askedSet = new Set(asked);

  if (shouldGuess(allUnis, answers, asked.length, excludedGuessIds)) {
    const viableUnis = getCompatibleUnis(allUnis, answers, excludedGuessIds);
    const scored = scoreAll(viableUnis, answers);
    return {
      state: { ...prevState, phase: "guessing", answers, asked, currentQuestionId: null },
      guessId: scored[0]?.id ?? null,
    };
  }

  const nextQ = selectNextQuestion(allUnis, answers, askedSet, questions, excludedGuessIds);
  if (!nextQ) {
    const viableUnis = getCompatibleUnis(allUnis, answers, excludedGuessIds);
    const scored = scoreAll(viableUnis, answers);
    return {
      state: { ...prevState, phase: "guessing", answers, asked, currentQuestionId: null },
      guessId: scored[0]?.id ?? null,
    };
  }

  return {
    state: { ...prevState, phase: "playing", answers, asked, currentQuestionId: nextQ },
    guessId: null,
  };
}

export function handleGuessCorrect(state: GameState): GameState {
  return { ...state, phase: "result_correct" };
}

export function handleGuessWrong(
  state: GameState,
  guessId: string | null,
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  questions: QuestionMeta[],
): ProcessResult {
  const newGuessCount = state.guessCount + 1;
  if (newGuessCount >= MAX_GUESSES) {
    return { state: { ...state, phase: "defeated", guessCount: newGuessCount }, guessId: null };
  }

  const excludedGuessIds = guessId && !state.excludedGuessIds.includes(guessId) ? [...state.excludedGuessIds, guessId] : state.excludedGuessIds;
  const askedSet = new Set(state.asked);
  const nextQ = selectNextQuestion(allUnis, state.answers, askedSet, questions, excludedGuessIds);

  if (!nextQ) {
    const viableUnis = getCompatibleUnis(allUnis, state.answers, excludedGuessIds);
    const scored = scoreAll(viableUnis, state.answers);
    const nextGuess = scored[newGuessCount] ?? scored[0];
    return {
      state: {
        ...state,
        phase: "guessing",
        guessCount: newGuessCount,
        excludedGuessIds,
        currentQuestionId: null,
      },
      guessId: nextGuess?.id ?? null,
    };
  }

  return {
    state: {
      ...state,
      phase: "playing",
      guessCount: newGuessCount,
      excludedGuessIds,
      currentQuestionId: nextQ,
    },
    guessId: null,
  };
}

export function startGame(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  questions: QuestionMeta[],
): GameState {
  return {
    phase: "playing",
    answers: {},
    asked: [],
    currentQuestionId: selectNextQuestion(allUnis, {}, new Set(), questions, []),
    guessCount: 0,
    excludedGuessIds: [],
  };
}
