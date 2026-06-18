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

type RankScope = "qs" | "china" | "general";

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
  return compatible.length > 0 ? compatible : allUnis.filter((u) => !excluded.has(u.id));
}

function sourceKey(question: QuestionMeta) {
  return (question.sourceId?.trim() || question.id).toLowerCase();
}

function qText(question: QuestionMeta) {
  return `${question.id} ${question.sourceId ?? ""} ${question.dimension ?? ""} ${question.textZh ?? ""} ${question.textEn ?? ""} ${(question.tags ?? []).join(" ")}`.toLowerCase();
}

function sourceIs(question: QuestionMeta, sourceId: string) {
  return sourceKey(question) === sourceId.toLowerCase() || question.id.toLowerCase() === sourceId.toLowerCase();
}

function sourceStarts(question: QuestionMeta, prefix: string) {
  const key = sourceKey(question);
  return key.startsWith(prefix.toLowerCase());
}

function answerOf(question: QuestionMeta, answers: Record<string, Answer>) {
  return answers[question.id] ?? (question.sourceId ? answers[question.sourceId] : undefined);
}

function answerBySource(
  sourceId: string,
  answers: Record<string, Answer>,
  questions: QuestionMeta[],
  askedSet: Set<string>,
): Answer | undefined {
  for (const question of questions) {
    if (!askedSet.has(question.id)) continue;
    if (!sourceIs(question, sourceId)) continue;
    return answerOf(question, answers);
  }
  return undefined;
}

function hasAskedSource(sourceId: string, questions: QuestionMeta[], askedSet: Set<string>) {
  return questions.some((question) => askedSet.has(question.id) && sourceIs(question, sourceId));
}

function questionFamily(question: QuestionMeta): string {
  const text = qText(question);
  if (/(qs|rank|ranking|reputation|world university|top\s*\d+|软科|中国大学排名|前\s*\d+)/.test(text)) return "rank";
  if (/(location|region|province|city|country|mainland|hong kong|macau|taiwan|overseas|domestic|abroad|district|华东|华北|华南|华中|西南|西北|东北|省|市)/.test(text)) return "location";
  if (/(name|school|institution|university name|official name|campus|校名|名字|简称)/.test(text)) return "name";
  if (/(major|subject|specialty|discipline|program|faculty|college of|school of|专业|学科|强校|方向)/.test(text)) return "major";
  return question.dimension?.trim().toLowerCase() || "general";
}

function rankScope(question: QuestionMeta): RankScope {
  const text = qText(question);
  if (/\bq_qs|\bqs\b|world university/.test(text)) return "qs";
  if (/软科|中国大学排名|china_rank|cn_rank|\bq_cn_(?:soft|rank)|主榜/.test(text)) return "china";
  return "general";
}

function rankThreshold(question: QuestionMeta): number | null {
  const source = sourceKey(question);
  const text = qText(question);

  const exactTop = source.match(/\bq_qs_top(\d{1,4})\b/) ?? source.match(/\bq_cn_soft_top(\d{1,4})\b/);
  if (exactTop) return Number(exactTop[1]);

  const broad = source.match(/\bq_qs(\d{3,4})\b/);
  if (broad) return Number(broad[1]);

  const ranged = source.match(/\bq_qs_(\d{1,4})_(\d{1,4})\b/);
  if (ranged) return Number(ranged[2]);

  const patterns = [
    /(?:qs|top|rank(?:ing)?|软科|前)\s*(?:世界|中国|主榜)?\s*(?:前)?\s*(\d{1,4})/,
    /前\s*(\d{1,4})/,
    /top\s*(\d{1,4})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function isQsQuestion(question: QuestionMeta) {
  const text = qText(question);
  return /\bq_qs|\bqs\b|world university/.test(text);
}

function isQsRankQuestion(question: QuestionMeta) {
  if (!isQsQuestion(question)) return false;
  return rankThreshold(question) !== null || /qs_rank|qs_only|qs_gate|排名|rank/.test(qText(question));
}

function isMainlandRootQuestion(question: QuestionMeta) {
  return sourceIs(question, "q_region_mainland");
}

function isHmtRootQuestion(question: QuestionMeta) {
  return sourceIs(question, "q_region_hmt");
}

function isWorldRegionQuestion(question: QuestionMeta) {
  return questionExclusiveGroup(question) === "region_world" || sourceStarts(question, "q_world_region_");
}

function isQsCountryQuestion(question: QuestionMeta) {
  return sourceStarts(question, "q_qs_country_");
}

function isProjectLabelQuestion(question: QuestionMeta): boolean {
  const key = sourceKey(question);
  return [
    "q_rank_985",
    "q_rank_211",
    "q_rank_dfc",
    "q_cn_985",
    "q_cn_211",
    "q_cn_double_first_class",
  ].includes(key);
}

function isMainlandOnlyQuestion(question: QuestionMeta): boolean {
  const text = qText(question);
  const tags = question.tags ?? [];
  if (tags.some((tag) => ["china_only", "china_rank", "china_province", "china_region"].includes(tag))) return true;
  if (sourceStarts(question, "q_cn_")) return true;
  if (sourceStarts(question, "q_china_area_")) return true;
  if (sourceStarts(question, "q_province_")) return true;
  if (sourceStarts(question, "q_city_") && !sourceIs(question, "q_city_capital")) return true;
  if (/(\b211\b|\b985\b|双一流|一流学科|软科|中国大学排名|主榜|校友会|武书连|华东|华北|华南|华中|西南|西北|东北|省会|直辖市|新一线|北上广深|一线城市)/.test(text)) return true;
  if (/(北京|天津|河北|山西|内蒙古|辽宁|吉林|黑龙江|上海|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|西藏|陕西|甘肃|青海|宁夏|新疆)/.test(text)) return true;
  return false;
}

function questionExclusiveGroup(question: QuestionMeta): string | null {
  if (isMainlandRootQuestion(question) || isHmtRootQuestion(question)) return "china_root_region";
  if (isQsCountryQuestion(question)) return "qs_country";
  return question.exclusiveGroup?.trim() || null;
}

function questionExclusiveValue(question: QuestionMeta): string | null {
  if (isMainlandRootQuestion(question)) return "mainland";
  if (isHmtRootQuestion(question)) return "hmt";
  if (isQsCountryQuestion(question)) return sourceKey(question);
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
    if (answerOf(question, answers) !== "yes") continue;

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
    if (answerOf(question, answers) !== "yes") continue;
    if (questionExclusiveGroup(question) !== group) continue;
    return true;
  }
  return false;
}

function currentRankBounds(
  answers: Record<string, Answer>,
  questions: QuestionMeta[],
  askedSet: Set<string>,
  scope: RankScope,
): RankBounds {
  let min = 1;
  let max = Number.POSITIVE_INFINITY;

  for (const question of questions) {
    if (!askedSet.has(question.id)) continue;
    if (rankScope(question) !== scope) continue;

    const threshold = rankThreshold(question);
    if (threshold === null) continue;

    const answer = answerOf(question, answers);
    if (answer === "yes") {
      max = Math.min(max, threshold);
    } else if (answer === "no") {
      min = Math.max(min, threshold + 1);
    }
  }

  return { min, max };
}

function contextAnswer(sourceId: string, answers: Record<string, Answer>, questions: QuestionMeta[], askedSet: Set<string>) {
  return answerBySource(sourceId, answers, questions, askedSet);
}

function shouldSkipByHardRules(
  question: QuestionMeta,
  answers: Record<string, Answer>,
  questions: QuestionMeta[],
  askedSet: Set<string>,
): boolean {
  if (askedSet.has(question.id)) return true;

  const locks = buildExclusiveLocks(answers, questions, askedSet);
  if (questionBlockedByLocks(question, locks)) return true;

  const mainland = contextAnswer("q_region_mainland", answers, questions, askedSet);
  const hmt = contextAnswer("q_region_hmt", answers, questions, askedSet);
  const qs1000 = contextAnswer("q_qs1000", answers, questions, askedSet);

  // 1. 已知不是中国大陆，就不要再问985/211/双一流/软科/华东/省份/新一线等大陆专属问题。
  if (mainland === "no") {
    if (isMainlandRootQuestion(question)) return true;
    if (isMainlandOnlyQuestion(question)) return true;
    if (sourceIs(question, "q_qs_country_003") || /中国大陆|china \(mainland\)/i.test(qText(question))) return true;
  }

  // 2. 已知是中国大陆，就不要再问港澳台、海外大洲、QS国家这种重复问题。
  if (mainland === "yes") {
    if (isHmtRootQuestion(question)) return true;
    if (isWorldRegionQuestion(question)) return true;
    if (isQsCountryQuestion(question)) return true;
  }

  // 3. 已知是港澳台，就不要问中国大陆专属标签。
  if (hmt === "yes") {
    if (isMainlandOnlyQuestion(question)) return true;
    if (isMainlandRootQuestion(question)) return true;
  }

  // 4. 明确不在QS前1000，就不要再问QS前10/50/100/500、QS国家、QS公私立等问题。
  if (qs1000 === "no" && isQsQuestion(question)) return true;

  // 5. QS/软科排名用区间边界剪枝：QS前10=是 后，QS前50/100/500/1000 全部跳过。
  if (questionFamily(question) === "rank") {
    const threshold = rankThreshold(question);
    if (threshold !== null) {
      const bounds = currentRankBounds(answers, questions, askedSet, rankScope(question));
      if (threshold >= bounds.max) return true;
      if (threshold < bounds.min) return true;
    }
  }

  return false;
}

function pickQuestion(
  questions: QuestionMeta[],
  candidateUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  askedSet: Set<string>,
  answers: Record<string, Answer>,
  predicate: (question: QuestionMeta) => boolean,
): string | null {
  let bestId: string | null = null;
  let bestScore = -Infinity;

  for (const question of questions) {
    if (shouldSkipByHardRules(question, answers, questions, askedSet)) continue;
    if (!predicate(question)) continue;

    let yesCount = 0;
    let noCount = 0;
    for (const uni of candidateUnis) {
      const value = uni.props[question.id];
      if (value === 1) yesCount++;
      else if (value === -1) noCount++;
    }

    // 候选集里全是同一个答案的问题没有信息量，直接不要问。
    if (yesCount === 0 || noCount === 0) continue;

    const balance = Math.min(yesCount, noCount);
    const coverage = yesCount + noCount;
    const score = balance * 10 + coverage * 0.02 + question.priority * 0.01;
    if (score > bestScore) {
      bestScore = score;
      bestId = question.id;
    }
  }

  return bestId;
}

function findQuestionBySource(questions: QuestionMeta[], askedSet: Set<string>, sourceId: string): string | null {
  for (const question of questions) {
    if (!sourceIs(question, sourceId)) continue;
    if (askedSet.has(question.id)) return null;
    return question.id;
  }
  return null;
}

function selectLocationQuestion(
  questions: QuestionMeta[],
  candidateUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  askedSet: Set<string>,
  answers: Record<string, Answer>,
): string | null {
  const mainland = contextAnswer("q_region_mainland", answers, questions, askedSet);
  const hmt = contextAnswer("q_region_hmt", answers, questions, askedSet);

  // 第一步必须先分中国大陆/非大陆，因为后面大量问题依赖这个答案。
  if (!hasAskedSource("q_region_mainland", questions, askedSet)) {
    return findQuestionBySource(questions, askedSet, "q_region_mainland");
  }

  if (mainland === "yes") {
    if (!hasPositiveAnswerForGroup(answers, questions, askedSet, "china_area")) {
      const nextArea = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => questionExclusiveGroup(q) === "china_area");
      if (nextArea) return nextArea;
    }

    if (!hasPositiveAnswerForGroup(answers, questions, askedSet, "province")) {
      const nextProvince = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => questionExclusiveGroup(q) === "province");
      if (nextProvince) return nextProvince;
    }

    if (!hasPositiveAnswerForGroup(answers, questions, askedSet, "city") && candidateUnis.length > 6) {
      const nextCity = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => questionExclusiveGroup(q) === "city");
      if (nextCity) return nextCity;
    }

    return null;
  }

  if (mainland === "no") {
    if (!hasAskedSource("q_region_hmt", questions, askedSet)) {
      return findQuestionBySource(questions, askedSet, "q_region_hmt");
    }

    if (hmt === "yes") return null;

    const worldRegion = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => isWorldRegionQuestion(q));
    if (worldRegion) return worldRegion;

    const country = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => isQsCountryQuestion(q));
    if (country) return country;
  }

  return null;
}

function selectRankQuestion(
  questions: QuestionMeta[],
  candidateUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  askedSet: Set<string>,
  answers: Record<string, Answer>,
): string | null {
  const mainland = contextAnswer("q_region_mainland", answers, questions, askedSet);
  const qs1000 = contextAnswer("q_qs1000", answers, questions, askedSet);

  // 海外/非大陆优先问QS门槛；大陆学校也可以问，但不能把QS问题当成大陆排名问题。
  if (qs1000 === undefined && (mainland === "no" || candidateUnis.length > 18)) {
    const gate = findQuestionBySource(questions, askedSet, "q_qs1000");
    if (gate) return gate;
  }

  // 对大陆学校，优先问 985/211/双一流 项目标签，这些问题的区分度通常比 QS/软科区间更高。
  if (mainland === "yes") {
    const labelQ = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => isProjectLabelQuestion(q));
    if (labelQ) return labelQ;
  }

  const scopeOrder: RankScope[] = mainland === "yes" ? ["china", "qs", "general"] : ["qs", "general"];

  for (const scope of scopeOrder) {
    const bounds = currentRankBounds(answers, questions, askedSet, scope);
    if (bounds.max <= 10) continue;

    const preferredThresholds = scope === "qs" ? [500, 200, 100, 50, 10] : [100, 50, 30, 10];
    for (const threshold of preferredThresholds) {
      const next = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => {
        if (questionFamily(q) !== "rank") return false;
        if (rankScope(q) !== scope) return false;
        return rankThreshold(q) === threshold;
      });
      if (next) return next;
    }

    const fallback = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => {
      if (questionFamily(q) !== "rank") return false;
      if (rankScope(q) !== scope) return false;
      return rankThreshold(q) !== null;
    });
    if (fallback) return fallback;
  }

  return null;
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
  const candidateIds = new Set(scored.filter((s) => s.score >= 0).slice(0, 40).map((s) => s.id));
  const candidateUnis = viableUnis.filter((u) => candidateIds.has(u.id));
  if (candidateUnis.length <= 1) return null;

  const locationQuestion = selectLocationQuestion(questions, candidateUnis, askedSet, answers);
  if (locationQuestion) return locationQuestion;

  const rankQuestion = selectRankQuestion(questions, candidateUnis, askedSet, answers);
  if (rankQuestion) return rankQuestion;

  // 排名问完后，如果候选集还很大，优先问学校类型（理工、师范、农林、医药等）。
  if (candidateUnis.length > 4) {
    const nextType = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => {
      const family = questionFamily(q);
      return family === "type" || family === "major";
    });
    if (nextType) return nextType;
  }

  // 候选集缩到较小范围时，问校名关键词（名字里是否有“林业”“邮电”“师范”等）。
  if (candidateUnis.length > 2) {
    const nextName = pickQuestion(questions, candidateUnis, askedSet, answers, (q) => questionFamily(q) === "name");
    if (nextName) return nextName;
  }

  return pickQuestion(questions, candidateUnis, askedSet, answers, () => true);
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
    const nextGuess = scored[0];
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
