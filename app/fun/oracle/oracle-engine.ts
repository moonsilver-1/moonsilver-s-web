export type Answer = "yes" | "no" | "unsure";

export type PropVal = -1 | 0 | 1;

export type Phase = "intro" | "playing" | "guessing" | "result_correct" | "result_wrong" | "defeated";

export type GameState = {
  phase: Phase;
  answers: Record<string, Answer>;
  asked: string[];
  currentQuestionId: string | null;
  guessCount: number;
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
};

const MATCH_BONUS = 2;
const CONTRADICT_PENALTY = 3;
const GUESS_GAP = 4;
const MAX_QUESTIONS = 20;
const MAX_GUESSES = 3;
const NAME_QUESTION_THRESHOLD = 6;
const RANK_QUESTION_THRESHOLD = 28;
const LOCATION_QUESTION_THRESHOLD = 18;
const MAJOR_QUESTION_THRESHOLD = 14;

export function initGame(): GameState {
  return {
    phase: "intro",
    answers: {},
    asked: [],
    currentQuestionId: null,
    guessCount: 0,
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
  return Object.entries(answers).every(([qId, answer]) => {
    const val = props[qId];
    if (answer === "unsure") return true;
    if (answer === "yes") return val !== -1;
    return val !== 1;
  });
}

function getCompatibleUnis(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  answers: Record<string, Answer>,
) {
  const compatible = allUnis.filter((u) => isCompatible(u.props, answers));
  return compatible.length > 0 ? compatible : allUnis;
}

function inferQuestionFamily(question: QuestionMeta): string {
  const haystack = `${question.id} ${question.sourceId ?? ""} ${question.dimension ?? ""} ${(question.tags ?? []).join(" ")}`.toLowerCase();

  if (/(qs|rank|ranking|reputation|world university|top\s*\d+)/.test(haystack)) return "rank";
  if (/(location|region|province|city|country|mainland|hong kong|macau|taiwan|overseas|domestic|abroad|district)/.test(haystack)) {
    return "location";
  }
  if (/(name|school|institution|university name|official name|campus)/.test(haystack)) return "name";
  if (/(major|subject|specialty|discipline|program|faculty|college of|school of)/.test(haystack)) return "major";
  return question.dimension?.trim().toLowerCase() || "general";
}

function familyPenalty(family: string, candidateCount: number): number {
  if (family === "name") return candidateCount > NAME_QUESTION_THRESHOLD ? 1000 : 0;
  if (family === "rank") return candidateCount > RANK_QUESTION_THRESHOLD ? 120 : 0;
  if (family === "location") return candidateCount > LOCATION_QUESTION_THRESHOLD ? 80 : 0;
  if (family === "major") return candidateCount > MAJOR_QUESTION_THRESHOLD ? 40 : 0;
  return 0;
}

function familyAllowed(family: string, candidateCount: number, askedFamilies: Set<string>): boolean {
  if (family === "name") return candidateCount <= NAME_QUESTION_THRESHOLD;
  if (family === "rank") return candidateCount <= RANK_QUESTION_THRESHOLD || askedFamilies.size >= 2;
  if (family === "location") return candidateCount <= LOCATION_QUESTION_THRESHOLD || askedFamilies.size >= 1;
  if (family === "major") return candidateCount <= MAJOR_QUESTION_THRESHOLD || askedFamilies.size >= 1;
  return true;
}

export function selectNextQuestion(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  answers: Record<string, Answer>,
  askedSet: Set<string>,
  questions: QuestionMeta[],
): string | null {
  const viableUnis = getCompatibleUnis(allUnis, answers);
  const scored = scoreAll(viableUnis, answers);
  const candidates = scored.filter((s) => s.score >= 0).slice(0, 30);
  if (candidates.length <= 1) return null;

  const candidateIds = new Set(candidates.map((c) => c.id));
  const candidateUnis = viableUnis.filter((u) => candidateIds.has(u.id));
  const askedFamilies = new Set(questions.filter((q) => askedSet.has(q.id)).map((q) => inferQuestionFamily(q)));

  let bestQ: string | null = null;
  let bestScore = -Infinity;
  let fallbackQ: string | null = null;
  let fallbackScore = -Infinity;

  for (const q of questions) {
    if (askedSet.has(q.id)) continue;

    const family = inferQuestionFamily(q);
    if (!familyAllowed(family, candidateUnis.length, askedFamilies)) continue;

    let yesCount = 0;
    let noCount = 0;
    for (const u of candidateUnis) {
      const v = u.props[q.id];
      if (v === 1) yesCount++;
      else if (v === -1) noCount++;
    }

    const split = Math.min(yesCount, noCount);
    const combined = split * 10 + q.priority * 0.01 - familyPenalty(family, candidateUnis.length);

    if (combined > fallbackScore) {
      fallbackScore = combined;
      fallbackQ = q.id;
    }

    if (family !== "general" && askedFamilies.has(family)) continue;

    if (combined > bestScore) {
      bestScore = combined;
      bestQ = q.id;
    }
  }

  return bestQ ?? fallbackQ;
}

export function shouldGuess(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  answers: Record<string, Answer>,
  askedCount: number,
): boolean {
  const viableUnis = getCompatibleUnis(allUnis, answers);
  const scored = scoreAll(viableUnis, answers);
  if (scored.length < 2) return true;
  const gap = scored[0].score - scored[1].score;
  if (gap >= GUESS_GAP) return true;
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
): ProcessResult {
  const qId = prevState.currentQuestionId!;
  const answers = { ...prevState.answers, [qId]: answer };
  const asked = [...prevState.asked, qId];
  const askedSet = new Set(asked);

  if (shouldGuess(allUnis, answers, asked.length)) {
    const viableUnis = getCompatibleUnis(allUnis, answers);
    const scored = scoreAll(viableUnis, answers);
    return {
      state: { ...prevState, phase: "guessing", answers, asked, currentQuestionId: null },
      guessId: scored[0]?.id ?? null,
    };
  }

  const nextQ = selectNextQuestion(allUnis, answers, askedSet, questions);
  if (!nextQ) {
    const viableUnis = getCompatibleUnis(allUnis, answers);
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
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  questions: QuestionMeta[],
): ProcessResult {
  const newGuessCount = state.guessCount + 1;
  if (newGuessCount >= MAX_GUESSES) {
    return {
      state: { ...state, phase: "defeated", guessCount: newGuessCount },
      guessId: null,
    };
  }

  const askedSet = new Set(state.asked);
  const nextQ = selectNextQuestion(allUnis, state.answers, askedSet, questions);

  if (!nextQ) {
    const viableUnis = getCompatibleUnis(allUnis, state.answers);
    const scored = scoreAll(viableUnis, state.answers);
    const nextGuess = scored[newGuessCount] ?? scored[0];
    return {
      state: {
        ...state,
        phase: "guessing",
        guessCount: newGuessCount,
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
      currentQuestionId: nextQ,
    },
    guessId: null,
  };
}

export function startGame(
  allUnis: Array<{ id: string; props: Record<string, PropVal> }>,
  questions: QuestionMeta[],
): GameState {
  const firstQ = selectNextQuestion(allUnis, {}, new Set(), questions);
  return {
    phase: "playing",
    answers: {},
    asked: [],
    currentQuestionId: firstQ,
    guessCount: 0,
  };
}
