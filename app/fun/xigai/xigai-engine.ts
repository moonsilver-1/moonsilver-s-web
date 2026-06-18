// 习概刷题 —— 引擎层（纯逻辑：判定 / 洗牌 / 抽样 / 会话 / 文案）
// 注意：buildSession 内使用 crypto.randomUUID() 与 Date.now()，仅在客户端事件处理器中调用，
// 不在组件渲染体执行，因此不会引发 hydration 不一致。

import { ALL_QUESTIONS, CHAPTERS, TOTAL_QUESTIONS } from "./xigai-data";
import type { DrillMode, Question, Session } from "./xigai-types";

// ----------------------------------------------------------------------------
// 中英双语文案
// ----------------------------------------------------------------------------

export type Copy = {
  backToFun: string;
  title: string;
  subtitle: string;
  meta: (questions: number, chapters: number) => string;
  modeChapter: string;
  modeWrong: string;
  modeRandom: string;
  modeExam: string;
  modeStats: string;
  shuffle: string;
  startChapter: string;
  questionUnit: string;
  progress: (cur: number, total: number) => string;
  typeSingle: string;
  typeMultiple: string;
  typeTrueFalse: string;
  submit: string;
  next: string;
  correctBadge: string;
  wrongBadge: string;
  answerLabel: string;
  finishRound: string;
  again: string;
  backHome: string;
  wrongCount: (n: number) => string;
  emptyWrong: string;
  drillWrong: string;
  examTitle: string;
  examHint: string;
  examLength: (n: number) => string;
  examDuration: string;
  submitExam: string;
  submitConfirm: string;
  cancel: string;
  confirm: string;
  timeUp: string;
  examResult: string;
  score: (s: number) => string;
  correctLabel: string;
  wrongLabel: string;
  unansweredLabel: string;
  timeUsed: (m: number) => string;
  reviewTitle: string;
  notStarted: string;
  accuracy: (correct: number, answered: number) => string;
  statsTitle: string;
  totalAnswered: (n: number) => string;
  overallAccuracy: (correct: number, answered: number) => string;
  reset: string;
  resetConfirm: string;
  chapterName: (idx: number) => string;
  emptyExam: string;
  reviewOnly: string;
  pass: string;
  fail: string;
};

export function getCopy(language: "zh" | "en"): Copy {
  if (language === "en") {
    return {
      backToFun: "Back to Fun",
      title: "Xigai Quiz",
      subtitle: "Strict-answer politics drill",
      meta: (q, c) => `${q} questions · ${c} chapters`,
      modeChapter: "By chapter",
      modeWrong: "Wrong book",
      modeRandom: "Random mix",
      modeExam: "Mock exam",
      modeStats: "Progress",
      shuffle: "Shuffle order",
      startChapter: "Start",
      questionUnit: "Q",
      progress: (cur, total) => `Q ${cur} / ${total}`,
      typeSingle: "Single choice",
      typeMultiple: "Multiple choice",
      typeTrueFalse: "True / False",
      submit: "Submit",
      next: "Next",
      correctBadge: "Correct",
      wrongBadge: "Wrong",
      answerLabel: "Answer",
      finishRound: "Finish round",
      again: "Again",
      backHome: "Home",
      wrongCount: (n) => `${n} wrong`,
      emptyWrong: "No wrong questions yet — answer some first.",
      drillWrong: "Drill wrong",
      examTitle: "Mock Exam",
      examHint: "Chapter-weighted sample, 45 min, 1 pt each",
      examLength: (n) => `${n} questions`,
      examDuration: "45 minutes",
      submitExam: "Submit",
      submitConfirm: "Submit the exam now?",
      cancel: "Cancel",
      confirm: "Submit",
      timeUp: "Time's up — auto-submitted",
      examResult: "Result",
      score: (s) => `${s} pts`,
      correctLabel: "Correct",
      wrongLabel: "Wrong",
      unansweredLabel: "Unanswered",
      timeUsed: (m) => `${m} min used`,
      reviewTitle: "Review",
      notStarted: "Not started",
      accuracy: (c, a) => (a > 0 ? `${c}/${a} right` : "Not started"),
      statsTitle: "Progress",
      totalAnswered: (n) => `${n} answered`,
      overallAccuracy: (c, a) => `Overall ${a > 0 ? Math.round((c / a) * 100) : 0}%`,
      reset: "Reset progress",
      resetConfirm: "Clear all progress and the wrong book? This cannot be undone.",
      chapterName: (idx) => `Ch. ${idx}`,
      emptyExam: "Not enough questions to build an exam.",
      reviewOnly: "Review",
      pass: "PASS",
      fail: "FAIL",
    };
  }

  return {
    backToFun: "返回 Fun",
    title: "习概刷题",
    subtitle: "严格判定 · 答案必须完全一致才算对",
    meta: (q, c) => `${q} 道题 · ${c} 章`,
    modeChapter: "章节练习",
    modeWrong: "错题本",
    modeRandom: "随机刷题",
    modeExam: "模拟考试",
    modeStats: "进度统计",
    shuffle: "随机顺序",
    startChapter: "开始",
    questionUnit: "题",
    progress: (cur, total) => `第 ${cur} / ${total} 题`,
    typeSingle: "单选题",
    typeMultiple: "多选题",
    typeTrueFalse: "判断题",
    submit: "提交答案",
    next: "下一题",
    correctBadge: "答对了",
    wrongBadge: "答错了",
    answerLabel: "正确答案",
    finishRound: "完成本轮",
    again: "再来一遍",
    backHome: "返回首页",
    wrongCount: (n) => `${n} 道错题`,
    emptyWrong: "错题本还是空的，先去做几道题吧。",
    drillWrong: "刷错题",
    examTitle: "模拟考试",
    examHint: "按章节分布抽题 · 限时 45 分钟 · 每题 1 分",
    examLength: (n) => `共 ${n} 题`,
    examDuration: "限时 45 分钟",
    submitExam: "交卷",
    submitConfirm: "确定现在交卷吗？",
    cancel: "取消",
    confirm: "确定交卷",
    timeUp: "时间到，已自动交卷",
    examResult: "考试结果",
    score: (s) => `${s} 分`,
    correctLabel: "答对",
    wrongLabel: "答错",
    unansweredLabel: "未答",
    timeUsed: (m) => `用时 ${m} 分钟`,
    reviewTitle: "逐题回顾",
    notStarted: "未开始",
    accuracy: (c, a) => (a > 0 ? `正确 ${c}/${a}` : "未开始"),
    statsTitle: "进度统计",
    totalAnswered: (n) => `累计答题 ${n}`,
    overallAccuracy: (c, a) => `总正确率 ${a > 0 ? Math.round((c / a) * 100) : 0}%`,
    reset: "清除进度与错题",
    resetConfirm: "确定清除全部做题进度与错题本？此操作不可恢复。",
    chapterName: (idx) => `第 ${idx} 章`,
    emptyExam: "题库不足，无法组卷。",
    reviewOnly: "回顾",
    pass: "及格",
    fail: "不及格",
  };
}

// ----------------------------------------------------------------------------
// 严格判定：集合严格相等，多选无部分分
// ----------------------------------------------------------------------------

export function judge(selected: readonly string[], answer: readonly string[]): boolean {
  if (selected.length !== answer.length) return false;
  const selectedSet = new Set(selected);
  for (const a of answer) {
    if (!selectedSet.has(a)) return false;
  }
  return true;
}

// ----------------------------------------------------------------------------
// Fisher–Yates 洗牌（返回新数组）
// ----------------------------------------------------------------------------

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ----------------------------------------------------------------------------
// 模拟考试分层抽样：按各章题量占比分配名额，再各章内随机取，最后整体打乱
// ----------------------------------------------------------------------------

export function pickExamQuestions(count: number): string[] {
  const clamped = Math.max(0, Math.min(count, ALL_QUESTIONS.length));
  if (clamped === 0) return [];

  const byChapter = new Map<number, Question[]>();
  for (const q of ALL_QUESTIONS) {
    const arr = byChapter.get(q.chapter_index);
    if (arr) arr.push(q);
    else byChapter.set(q.chapter_index, [q]);
  }

  // 各章基础名额（向下取整）
  const quota = new Map<number, number>();
  let allocated = 0;
  for (const c of CHAPTERS) {
    const n = Math.floor((clamped * c.total) / TOTAL_QUESTIONS);
    quota.set(c.chapter_index, n);
    allocated += n;
  }
  // 余数分配给题量较多的章（避免丢题）
  const orderBySize = [...CHAPTERS].sort((a, b) => b.total - a.total);
  let idx = 0;
  while (allocated < clamped) {
    const ci = orderBySize[idx % orderBySize.length].chapter_index;
    quota.set(ci, (quota.get(ci) ?? 0) + 1);
    allocated++;
    idx++;
  }

  const picked: Question[] = [];
  for (const [ci, n] of quota) {
    const pool = byChapter.get(ci) ?? [];
    picked.push(...shuffle(pool).slice(0, n));
  }
  return shuffle(picked).map((q) => q.id);
}

// ----------------------------------------------------------------------------
// 构建一轮会话
// ----------------------------------------------------------------------------

export interface BuildOptions {
  chapterIndex?: number;
  shuffle?: boolean;
  examLength?: number;
  examDurationSec?: number;
}

export const EXAM_DEFAULT_LENGTH = 50;
export const EXAM_DEFAULT_DURATION_SEC = 45 * 60;

export function buildSession(
  mode: DrillMode,
  wrongIds: readonly string[],
  opts: BuildOptions = {},
): Session {
  let questionIds: string[];

  switch (mode) {
    case "chapter":
      questionIds = ALL_QUESTIONS.filter((q) => q.chapter_index === opts.chapterIndex).map(
        (q) => q.id,
      );
      if (opts.shuffle) questionIds = shuffle(questionIds);
      break;
    case "wrong":
      questionIds = shuffle(wrongIds);
      break;
    case "mixed":
      questionIds = shuffle(ALL_QUESTIONS.map((q) => q.id));
      break;
    case "exam":
      questionIds = pickExamQuestions(opts.examLength ?? EXAM_DEFAULT_LENGTH);
      break;
    default:
      questionIds = [];
  }

  const startedAt = Date.now();
  const session: Session = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(startedAt) + Math.random().toString(16).slice(2),
    mode,
    questionIds,
    cursor: 0,
    items: {},
    startedAt,
    finished: false,
  };

  if (mode === "exam") {
    session.endsAt = startedAt + (opts.examDurationSec ?? EXAM_DEFAULT_DURATION_SEC) * 1000;
  }

  return session;
}

// ----------------------------------------------------------------------------
// 会话汇总（成绩、用时）
// ----------------------------------------------------------------------------

export interface SessionSummary {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number; // 0..100
}

export function summarizeSession(session: Session): SessionSummary {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  for (const id of session.questionIds) {
    const it = session.items[id];
    if (!it || !it.submitted) unanswered++;
    else if (it.correct) correct++;
    else wrong++;
  }
  const total = session.questionIds.length;
  return {
    total,
    correct,
    wrong,
    unanswered,
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

/** 格式化秒为 MM:SS */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
