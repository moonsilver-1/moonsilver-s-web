"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import {
  CHAPTERS,
  QUESTION_BY_ID,
  TOTAL_CHAPTERS,
  TOTAL_QUESTIONS,
} from "./xigai-data";
import {
  EXAM_DEFAULT_LENGTH,
  buildSession,
  formatClock,
  getCopy,
  judge,
  summarizeSession,
} from "./xigai-engine";
import type { Copy } from "./xigai-engine";
import type {
  GlobalStat,
  Question,
  Screen,
  Session,
  SessionItem,
  Stats,
  TypeKey,
} from "./xigai-types";

// ---------------------------------------------------------------------------
// localStorage（键名前缀 moonsilver-xigai-*，SSR 守卫 + try/catch + 形状校验）
// ---------------------------------------------------------------------------

const LS_WRONG = "moonsilver-xigai-wrong";
const LS_STATS = "moonsilver-xigai-stats";
const LS_GLOBAL = "moonsilver-xigai-global";

function readWrong(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_WRONG);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function readStats(): Stats {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_STATS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Stats = {};
    for (const k of Object.keys(parsed)) {
      const v = parsed[k];
      if (v && typeof v === "object") {
        const ci = Number(k);
        const rec = v as { answered?: unknown; correct?: unknown };
        if (Number.isFinite(ci)) {
          out[ci] = {
            answered: typeof rec.answered === "number" ? rec.answered : 0,
            correct: typeof rec.correct === "number" ? rec.correct : 0,
          };
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

function readGlobal(): GlobalStat {
  if (typeof window === "undefined") return { answered: 0, correct: 0 };
  try {
    const raw = window.localStorage.getItem(LS_GLOBAL);
    if (!raw) return { answered: 0, correct: 0 };
    const parsed = JSON.parse(raw) as { answered?: unknown; correct?: unknown };
    return {
      answered: typeof parsed.answered === "number" ? parsed.answered : 0,
      correct: typeof parsed.correct === "number" ? parsed.correct : 0,
    };
  } catch {
    return { answered: 0, correct: 0 };
  }
}

function writeWrong(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_WRONG, JSON.stringify(ids));
  } catch {
    /* 忽略配额/序列化错误 */
  }
}

function writeStats(stats: Stats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_STATS, JSON.stringify(stats));
  } catch {
    /* 忽略 */
  }
}

function writeGlobal(g: GlobalStat) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_GLOBAL, JSON.stringify(g));
  } catch {
    /* 忽略 */
  }
}

// ---------------------------------------------------------------------------
// 作用域样式（前缀 xigai-*）
// ---------------------------------------------------------------------------

function XigaiStyles() {
  return (
    <style>{`
      @keyframes xigai-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .xigai-in { animation: xigai-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .xigai-qcard { animation: xigai-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes xigai-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.45; }
      }
      .xigai-low { animation: xigai-pulse 1s ease-in-out infinite; }
      .xigai-scroll::-webkit-scrollbar { width: 8px; }
      .xigai-scroll::-webkit-scrollbar-thumb {
        background: var(--app-border-strong); border-radius: 8px;
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function XigaiClient() {
  const { language } = useSiteLanguage();
  const copy = useMemo(() => getCopy(language), [language]);

  const [screen, setScreen] = useState<Screen>({ kind: "home" });
  const [wrongBook, setWrongBook] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [globalStat, setGlobalStat] = useState<GlobalStat>({ answered: 0, correct: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [examConfirming, setExamConfirming] = useState(false);

  // 持有最新 screen，供稳定的 finishExam 读取
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // 水合：首次挂载读取 localStorage
  useEffect(() => {
    setWrongBook(readWrong());
    setStats(readStats());
    setGlobalStat(readGlobal());
    setHydrated(true);
  }, []);

  // 持久化（水合后再写，避免用空值覆盖）
  useEffect(() => {
    if (hydrated) writeWrong(wrongBook);
  }, [wrongBook, hydrated]);
  useEffect(() => {
    if (hydrated) writeStats(stats);
  }, [stats, hydrated]);
  useEffect(() => {
    if (hydrated) writeGlobal(globalStat);
  }, [globalStat, hydrated]);

  const wrongSet = useMemo(() => new Set(wrongBook), [wrongBook]);

  // ---- 进入各模式 ----
  const startChapter = useCallback(
    (chapterIndex: number) => {
      const session = buildSession("chapter", wrongBook, { chapterIndex, shuffle });
      setScreen({ kind: "drill", session });
    },
    [wrongBook, shuffle],
  );

  const startWrong = useCallback(() => {
    if (wrongBook.length === 0) return;
    setScreen({ kind: "drill", session: buildSession("wrong", wrongBook) });
  }, [wrongBook]);

  const startMixed = useCallback(() => {
    setScreen({ kind: "drill", session: buildSession("mixed", wrongBook) });
  }, [wrongBook]);

  const startExam = useCallback(() => {
    setExamConfirming(false);
    setScreen({ kind: "exam", session: buildSession("exam", wrongBook) });
  }, [wrongBook]);

  const goHome = useCallback(() => {
    setExamConfirming(false);
    setScreen({ kind: "home" });
  }, []);

  // ---- 提交单题 ----
  const handleSubmit = useCallback(
    (session: Session, questionId: string, selected: string[]) => {
      const q = QUESTION_BY_ID.get(questionId);
      if (!q) return;
      const correct = judge(selected, q.answer);
      const sortedSel = [...selected].sort();
      const items: Record<string, SessionItem> = {
        ...session.items,
        [questionId]: { selected: sortedSel, submitted: true, correct },
      };
      setScreen((prev) =>
        prev.kind === "drill" || prev.kind === "exam"
          ? { ...prev, session: { ...prev.session, items } }
          : prev,
      );

      // 仅练习模式（chapter / wrong / mixed）逐题更新持久数据；考试交卷时批量处理
      if (session.mode !== "exam") {
        setWrongBook((prev) => {
          const next = new Set(prev);
          if (correct) next.delete(questionId);
          else next.add(questionId);
          return [...next];
        });
        const ci = q.chapter_index;
        setStats((prev) => {
          const cur = prev[ci] ?? { answered: 0, correct: 0 };
          return {
            ...prev,
            [ci]: {
              answered: cur.answered + 1,
              correct: cur.correct + (correct ? 1 : 0),
            },
          };
        });
        setGlobalStat((prev) => ({
          answered: prev.answered + 1,
          correct: prev.correct + (correct ? 1 : 0),
        }));
      }
    },
    [],
  );

  // ---- 导航 ----
  const moveCursor = useCallback((delta: number) => {
    setScreen((prev) => {
      if (prev.kind !== "drill" && prev.kind !== "exam") return prev;
      const max = prev.session.questionIds.length - 1;
      const next = Math.max(0, Math.min(max, prev.session.cursor + delta));
      return { ...prev, session: { ...prev.session, cursor: next } };
    });
  }, []);

  const goTo = useCallback((cursor: number) => {
    setScreen((prev) => {
      if (prev.kind !== "drill" && prev.kind !== "exam") return prev;
      const max = prev.session.questionIds.length - 1;
      const next = Math.max(0, Math.min(max, cursor));
      return { ...prev, session: { ...prev.session, cursor: next } };
    });
  }, []);

  // ---- 重做本轮 ----
  const restartRound = useCallback(
    (session: Session) => {
      if (session.mode === "chapter") {
        const first = QUESTION_BY_ID.get(session.questionIds[0]);
        const chapterIndex = first?.chapter_index;
        if (chapterIndex == null) return goHome();
        setScreen({ kind: "drill", session: buildSession("chapter", wrongBook, { chapterIndex, shuffle }) });
      } else if (session.mode === "wrong") {
        if (wrongBook.length === 0) return goHome();
        setScreen({ kind: "drill", session: buildSession("wrong", wrongBook) });
      } else {
        setScreen({ kind: "drill", session: buildSession("mixed", wrongBook) });
      }
    },
    [wrongBook, shuffle, goHome],
  );

  // ---- 交卷（稳定引用，供计时器 effect 使用）----
  const finishExam = useCallback(() => {
    const prev = screenRef.current;
    if (prev.kind !== "exam") return;
    const session = prev.session;
    const items: Record<string, SessionItem> = { ...session.items };
    for (const id of session.questionIds) {
      const it = items[id];
      if (!it || !it.submitted) {
        items[id] = { selected: [], submitted: true, correct: false };
      }
    }
    const finished: Session = { ...session, items, finished: true };
    setExamConfirming(false);
    setScreen({ kind: "exam-review", session: finished });

    const summary = summarizeSession(finished);
    setGlobalStat((g) => ({
      answered: g.answered + summary.total,
      correct: g.correct + summary.correct,
    }));
    setWrongBook((wb) => {
      const next = new Set(wb);
      for (const id of finished.questionIds) {
        const it = finished.items[id];
        if (it?.correct) next.delete(id);
        else if (it) next.add(id);
      }
      return [...next];
    });
  }, []);

  // ---- 考试倒计时 ----
  useEffect(() => {
    if (screen.kind !== "exam") return;
    const endsAt = screen.session.endsAt;
    if (!endsAt) return;
    const tick = () => {
      const remain = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(remain);
      if (remain <= 0) finishExam();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [screen, finishExam]);

  // ---- 清除进度 ----
  const resetProgress = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.confirm(copy.resetConfirm)) return;
    setWrongBook([]);
    setStats({});
    setGlobalStat({ answered: 0, correct: 0 });
  }, [copy.resetConfirm]);

  // ---- 渲染分发 ----
  let content: React.ReactNode = null;

  if (screen.kind === "home") {
    content = (
      <HomeScreen
        copy={copy}
        hydrated={hydrated}
        wrongCount={wrongBook.length}
        stats={stats}
        shuffle={shuffle}
        onToggleShuffle={() => setShuffle((s) => !s)}
        onPickChapter={startChapter}
        onStartWrong={startWrong}
        onStartMixed={startMixed}
        onStartExam={startExam}
        onOpenStats={() => setScreen({ kind: "stats" })}
        onOpenWrong={() => setScreen({ kind: "wrong-list" })}
      />
    );
  } else if (screen.kind === "drill") {
    content = (
      <DrillScreen
        copy={copy}
        session={screen.session}
        onSubmit={(qid, sel) => handleSubmit(screen.session, qid, sel)}
        onNext={() => moveCursor(1)}
        onPrev={() => moveCursor(-1)}
        onRestart={() => restartRound(screen.session)}
        onHome={goHome}
      />
    );
  } else if (screen.kind === "exam") {
    content = (
      <ExamScreen
        copy={copy}
        session={screen.session}
        secondsLeft={secondsLeft}
        onSubmit={(qid, sel) => handleSubmit(screen.session, qid, sel)}
        onPrev={() => moveCursor(-1)}
        onNext={() => moveCursor(1)}
        onGoTo={goTo}
        examining
        confirming={examConfirming}
        onAskSubmit={() => setExamConfirming(true)}
        onCancelSubmit={() => setExamConfirming(false)}
        onConfirmSubmit={finishExam}
      />
    );
  } else if (screen.kind === "exam-review") {
    content = (
      <ExamScreen
        copy={copy}
        session={screen.session}
        secondsLeft={0}
        onSubmit={() => {}}
        onPrev={() => {}}
        onNext={() => {}}
        onGoTo={() => {}}
        examining={false}
        confirming={false}
        onAskSubmit={() => {}}
        onCancelSubmit={() => {}}
        onConfirmSubmit={() => {}}
        onHome={goHome}
      />
    );
  } else if (screen.kind === "wrong-list") {
    content = (
      <WrongListScreen
        copy={copy}
        wrongIds={wrongBook}
        onDrill={startWrong}
        onHome={goHome}
      />
    );
  } else if (screen.kind === "stats") {
    content = (
      <StatsScreen
        copy={copy}
        hydrated={hydrated}
        stats={stats}
        globalStat={globalStat}
        onReset={resetProgress}
        onHome={goHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300 page-enter">
      <XigaiStyles />
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
        <div className="mb-8">
          <Link
            href="/fun"
            className="link-arrow inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/70 px-4 py-2 text-sm text-[var(--app-muted)] backdrop-blur-sm transition-colors hover:text-[var(--app-fg)]"
          >
            <span className="text-base">←</span>
            {copy.backToFun}
          </Link>
        </div>
        {content}
      </div>
    </div>
  );
}

// ===========================================================================
// 首页
// ===========================================================================

function HomeScreen(props: {
  copy: Copy;
  hydrated: boolean;
  wrongCount: number;
  stats: Stats;
  shuffle: boolean;
  onToggleShuffle: () => void;
  onPickChapter: (idx: number) => void;
  onStartWrong: () => void;
  onStartMixed: () => void;
  onStartExam: () => void;
  onOpenStats: () => void;
  onOpenWrong: () => void;
}) {
  const { copy, hydrated, wrongCount, stats, shuffle } = props;

  const handleTilt = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--mouse-y", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="xigai-in">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">
        {copy.meta(TOTAL_QUESTIONS, TOTAL_CHAPTERS)}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{copy.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--app-muted)] md:text-base">
        {copy.subtitle}
      </p>

      {/* 模式入口 */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ModeCard label={copy.modeWrong} value={hydrated ? copy.wrongCount(wrongCount) : "–"} onClick={props.onOpenWrong} accent />
        <ModeCard label={copy.modeRandom} onClick={props.onStartMixed} />
        <ModeCard label={copy.modeExam} onClick={props.onStartExam} />
        <ModeCard label={copy.modeStats} onClick={props.onOpenStats} />
      </div>

      {/* 随机顺序开关 */}
      <label className="mt-6 inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/50 px-4 py-2 text-sm text-[var(--app-muted)]">
        <input
          type="checkbox"
          checked={shuffle}
          onChange={props.onToggleShuffle}
          className="h-4 w-4 accent-[var(--app-fg)]"
        />
        {copy.shuffle}
      </label>

      {/* 章节网格 */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHAPTERS.map((c) => {
          const st = stats[c.chapter_index];
          const accuracy = hydrated && st && st.answered > 0
            ? Math.round((st.correct / st.answered) * 100)
            : null;
          const pct = accuracy == null ? 0 : accuracy;
          return (
            <button
              key={c.chapter_index}
              onClick={() => props.onPickChapter(c.chapter_index)}
              onMouseMove={handleTilt}
              className="card-tilt-glow group relative block overflow-hidden rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-5 text-left transition-all duration-300 hover:border-[var(--app-border-strong)] hover:shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">{copy.chapterName(c.chapter_index)}</h3>
                <span className="text-xs text-[var(--app-muted)]">
                  {c.total}
                  {copy.questionUnit}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-border)]">
                <div
                  className="h-full rounded-full bg-[var(--app-fg)] opacity-70 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--app-muted)]">
                {hydrated
                  ? accuracy == null
                    ? copy.notStarted
                    : copy.accuracy(st!.correct, st!.answered)
                  : "–"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModeCard(props: {
  label: string;
  value?: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={props.onClick}
      className={`rounded-[18px] border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)] ${
        props.accent
          ? "border-[var(--app-border-strong)] bg-[var(--app-surface)]/80"
          : "border-[var(--app-border)] bg-[var(--app-surface)]/40"
      }`}
    >
      <div className="text-sm font-semibold tracking-tight text-[var(--app-fg)]">{props.label}</div>
      {props.value ? (
        <div className="mt-1 text-xs text-[var(--app-muted)]">{props.value}</div>
      ) : null}
    </button>
  );
}

// ===========================================================================
// 练习屏（chapter / wrong / mixed 共用）
// ===========================================================================

function DrillScreen(props: {
  copy: Copy;
  session: Session;
  onSubmit: (qid: string, selected: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  const { copy, session } = props;
  const total = session.questionIds.length;

  if (total === 0) {
    return (
      <EmptyState copy={copy} text={copy.emptyWrong} onHome={props.onHome} />
    );
  }

  const qid = session.questionIds[session.cursor];
  const q = QUESTION_BY_ID.get(qid);
  if (!q) {
    return <EmptyState copy={copy} text={copy.emptyWrong} onHome={props.onHome} />;
  }

  const item = session.items[qid];
  const submitted = !!item?.submitted;
  const isLast = session.cursor >= total - 1;
  const correctSoFar = session.questionIds.reduce(
    (n, id) => (session.items[id]?.correct ? n + 1 : n),
    0,
  );

  return (
    <div className="xigai-in">
      <SessionHeader
        copy={copy}
        title={modeTitle(copy, session.mode)}
        cursor={session.cursor}
        total={total}
        sideText={copy.accuracy(correctSoFar, session.questionIds.filter((id) => session.items[id]?.submitted).length)}
      />

      <QuestionCard
        key={qid}
        question={q}
        item={item}
        copy={copy}
        onSubmit={(sel) => props.onSubmit(qid, sel)}
      />

      <DrillNav
        copy={copy}
        submitted={submitted}
        isLast={isLast}
        cursor={session.cursor}
        onPrev={props.onPrev}
        onNext={props.onNext}
        onRestart={props.onRestart}
        onHome={props.onHome}
      />
    </div>
  );
}

function DrillNav(props: {
  copy: Copy;
  submitted: boolean;
  isLast: boolean;
  cursor: number;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  if (!props.submitted) {
    return (
      <div className="mt-6 flex items-center justify-between">
        <NavBtn onClick={props.onPrev} disabled={props.cursor === 0} ghost>
          ←
        </NavBtn>
        <span className="text-xs text-[var(--app-muted)]">{props.copy.submit}</span>
        <span className="w-10" />
      </div>
    );
  }
  if (props.isLast) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <PrimaryBtn onClick={props.onRestart}>{props.copy.again}</PrimaryBtn>
        <GhostBtn onClick={props.onHome}>{props.copy.backHome}</GhostBtn>
      </div>
    );
  }
  return (
    <div className="mt-6 flex items-center justify-between">
      <NavBtn onClick={props.onPrev} disabled={props.cursor === 0} ghost>
        ←
      </NavBtn>
      <PrimaryBtn onClick={props.onNext}>{props.copy.next} →</PrimaryBtn>
    </div>
  );
}

// ===========================================================================
// 考试屏 + 成绩单回顾（exam / exam-review 共用，examining 区分）
// ===========================================================================

function ExamScreen(props: {
  copy: Copy;
  session: Session;
  secondsLeft: number;
  examining: boolean;
  confirming: boolean;
  onSubmit: (qid: string, selected: string[]) => void;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (cursor: number) => void;
  onAskSubmit: () => void;
  onCancelSubmit: () => void;
  onConfirmSubmit: () => void;
  onHome?: () => void;
}) {
  const { copy, session, examining } = props;
  const total = session.questionIds.length;

  if (!examining) {
    // 成绩单回顾
    const summary = summarizeSession(session);
    const passed = summary.score >= 60;
    const usedMin = Math.max(0, Math.round((Date.now() - session.startedAt) / 60000));
    return (
      <div className="xigai-in">
        <ScoreCard
          copy={copy}
          score={summary.score}
          passed={passed}
          correct={summary.correct}
          wrong={summary.wrong}
          unanswered={summary.unanswered}
          total={summary.total}
          usedMin={usedMin}
        />
        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]">
            {copy.reviewTitle}
          </h3>
          <div className="mt-4 space-y-4">
            {session.questionIds.map((id, i) => {
              const q = QUESTION_BY_ID.get(id);
              const it = session.items[id];
              if (!q) return null;
              return (
                <div key={id} className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)]/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-[var(--app-muted)]">
                    <span>#{i + 1}</span>
                    <span>{typeLabel(copy, q.type_key)}</span>
                    {it?.correct ? (
                      <Badge tone="ok">{copy.correctBadge}</Badge>
                    ) : (
                      <Badge tone="bad">{copy.wrongBadge}</Badge>
                    )}
                  </div>
                  <QuestionCard question={q} item={it} copy={copy} onSubmit={() => {}} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-8">
          <PrimaryBtn onClick={props.onHome ?? (() => {})}>{copy.backHome}</PrimaryBtn>
        </div>
      </div>
    );
  }

  // 考试进行中
  const qid = session.questionIds[session.cursor];
  const q = QUESTION_BY_ID.get(qid);
  if (!q) return null;
  const item = session.items[qid];
  const low = props.secondsLeft <= 60;

  return (
    <div className="xigai-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{copy.examTitle}</h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {copy.examLength(total)} · {copy.examHint}
          </p>
        </div>
        <div className={`text-2xl font-bold tabular-nums ${low ? "xigai-low text-rose-500" : "text-[var(--app-fg)]"}`}>
          ⏱ {formatClock(props.secondsLeft)}
        </div>
      </div>

      {/* 圆点进度 */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {session.questionIds.map((id, i) => {
          const it = session.items[id];
          let tone = "pending";
          if (it?.submitted) tone = it.correct ? "ok" : "bad";
          const isCurrent = i === session.cursor;
          return (
            <button
              key={id}
              onClick={() => props.onGoTo(i)}
              className={`h-6 w-6 rounded-md border text-[11px] font-medium transition-all ${
                tone === "ok"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500"
                  : tone === "bad"
                    ? "border-rose-500/50 bg-rose-500/15 text-rose-500"
                    : isCurrent
                      ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-fg)]"
                      : "border-[var(--app-border)] bg-transparent text-[var(--app-muted)]"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <QuestionCard
        key={qid}
        question={q}
        item={item}
        copy={copy}
        onSubmit={(sel) => props.onSubmit(qid, sel)}
      />

      <div className="mt-6 flex items-center justify-between gap-3">
        <NavBtn onClick={props.onPrev} disabled={session.cursor === 0} ghost>
          ←
        </NavBtn>
        {session.cursor >= total - 1 ? (
          <PrimaryBtn onClick={props.onNext} disabled>
            {copy.next} →
          </PrimaryBtn>
        ) : (
          <PrimaryBtn onClick={props.onNext}>{copy.next} →</PrimaryBtn>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--app-border)] pt-5">
        {props.confirming ? (
          <>
            <span className="text-sm text-[var(--app-muted)]">{copy.submitConfirm}</span>
            <GhostBtn onClick={props.onCancelSubmit}>{copy.cancel}</GhostBtn>
            <PrimaryBtn onClick={props.onConfirmSubmit}>{copy.confirm}</PrimaryBtn>
          </>
        ) : (
          <GhostBtn onClick={props.onAskSubmit}>{copy.submitExam}</GhostBtn>
        )}
      </div>
    </div>
  );
}

function ScoreCard(props: {
  copy: Copy;
  score: number;
  passed: boolean;
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  usedMin: number;
}) {
  const { copy } = props;
  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/60 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.examResult}</p>
      <div className={`mt-3 text-6xl font-bold tabular-nums ${props.passed ? "text-emerald-500" : "text-rose-500"}`}>
        {copy.score(props.score)}
      </div>
      <div className={`mt-2 text-sm font-medium ${props.passed ? "text-emerald-500" : "text-rose-500"}`}>
        {props.passed ? copy.pass : copy.fail}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <Stat label={copy.correctLabel} value={props.correct} tone="ok" />
        <Stat label={copy.wrongLabel} value={props.wrong} tone="bad" />
        <Stat label={copy.unansweredLabel} value={props.unanswered} tone="muted" />
      </div>
      <p className="mt-4 text-xs text-[var(--app-muted)]">
        {copy.timeUsed(props.usedMin)} · {copy.examLength(props.total)}
      </p>
    </div>
  );
}

function Stat(props: { label: string; value: number; tone: "ok" | "bad" | "muted" }) {
  const color =
    props.tone === "ok" ? "text-emerald-500" : props.tone === "bad" ? "text-rose-500" : "text-[var(--app-muted)]";
  return (
    <div className="rounded-[14px] border border-[var(--app-border)] bg-[var(--app-bg)]/40 p-3">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{props.value}</div>
      <div className="mt-1 text-xs text-[var(--app-muted)]">{props.label}</div>
    </div>
  );
}

// ===========================================================================
// 错题本列表
// ===========================================================================

function WrongListScreen(props: {
  copy: Copy;
  wrongIds: string[];
  onDrill: () => void;
  onHome: () => void;
}) {
  const { copy, wrongIds } = props;
  return (
    <div className="xigai-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{copy.modeWrong}</h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">{copy.wrongCount(wrongIds.length)}</p>
        </div>
        {wrongIds.length > 0 ? (
          <PrimaryBtn onClick={props.onDrill}>{copy.drillWrong} →</PrimaryBtn>
        ) : null}
      </div>

      {wrongIds.length === 0 ? (
        <EmptyState copy={copy} text={copy.emptyWrong} onHome={props.onHome} />
      ) : (
        <div className="space-y-3">
          {wrongIds.map((id) => {
            const q = QUESTION_BY_ID.get(id);
            if (!q) return null;
            return (
              <div
                key={id}
                className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)]/40 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-[var(--app-muted)]">
                  <span>{copy.chapterName(q.chapter_index)}</span>
                  <span>·</span>
                  <span>{typeLabel(copy, q.type_key)}</span>
                </div>
                <p className="text-sm leading-6 text-[var(--app-fg)]">{q.stem}</p>
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  {copy.answerLabel}：{q.answer_text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// 进度统计
// ===========================================================================

function StatsScreen(props: {
  copy: Copy;
  hydrated: boolean;
  stats: Stats;
  globalStat: GlobalStat;
  onReset: () => void;
  onHome: () => void;
}) {
  const { copy, hydrated, stats, globalStat } = props;
  return (
    <div className="xigai-in">
      <h2 className="text-2xl font-bold tracking-tight">{copy.statsTitle}</h2>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)]/50 p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
            {hydrated ? copy.totalAnswered(globalStat.answered) : "–"}
          </div>
          <div className="mt-2 text-2xl font-bold">
            {hydrated ? copy.overallAccuracy(globalStat.correct, globalStat.answered) : "–"}
          </div>
        </div>
        <button
          onClick={props.onReset}
          className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)]/50 p-5 text-left text-sm text-[var(--app-muted)] transition-colors hover:border-rose-500/50 hover:text-rose-500"
        >
          {copy.reset}
        </button>
      </div>

      <div className="mt-8 space-y-2">
        {CHAPTERS.map((c) => {
          const st = stats[c.chapter_index];
          const answered = st?.answered ?? 0;
          const correct = st?.correct ?? 0;
          const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
          return (
            <div
              key={c.chapter_index}
              className="flex items-center gap-4 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)]/30 px-4 py-3"
            >
              <div className="w-20 shrink-0 text-sm font-medium">{copy.chapterName(c.chapter_index)}</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--app-border)]">
                <div className="h-full rounded-full bg-[var(--app-fg)] opacity-70" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-28 shrink-0 text-right text-xs text-[var(--app-muted)]">
                {hydrated && answered > 0 ? copy.accuracy(correct, answered) : copy.notStarted}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <GhostBtn onClick={props.onHome}>{copy.backHome}</GhostBtn>
      </div>
    </div>
  );
}

// ===========================================================================
// 题目卡片（单选 / 多选 / 判断统一处理）
// ===========================================================================

function QuestionCard(props: {
  question: Question;
  item: SessionItem | undefined;
  copy: Copy;
  onSubmit: (selected: string[]) => void;
}) {
  const { question, item, copy, onSubmit } = props;
  const [local, setLocal] = useState<string[]>(item?.selected ?? []);
  useEffect(() => {
    setLocal(item?.selected ?? []);
  }, [question.id, item?.selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitted = !!item?.submitted;
  const isMultiple = question.type_key === "multiple";
  const selectedKeys = submitted ? item!.selected : local;

  const handleClick = (key: string) => {
    if (submitted) return;
    if (isMultiple) {
      setLocal((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    } else {
      onSubmit([key]); // 单选 / 判断：点选即提交
    }
  };

  return (
    <div className="xigai-qcard rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-5 sm:p-7">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <Badge tone="neutral">{typeLabel(copy, question.type_key)}</Badge>
        {submitted ? (
          item!.correct ? (
            <Badge tone="ok">{copy.correctBadge}</Badge>
          ) : (
            <Badge tone="bad">{copy.wrongBadge}</Badge>
          )
        ) : null}
      </div>

      <p className="text-base leading-8 text-[var(--app-fg)] sm:text-lg">{question.stem}</p>

      <div className="mt-5 space-y-2.5">
        {question.options.map((opt) => {
          const isAnswer = question.answer.includes(opt.key);
          const isSelected = selectedKeys.includes(opt.key);
          const cls = optionClass(submitted, isAnswer, isSelected);
          return (
            <button
              key={opt.key}
              type="button"
              disabled={submitted}
              onClick={() => handleClick(opt.key)}
              className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-sm transition-all duration-200 ${cls}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  submitted && isAnswer
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-500"
                    : submitted && isSelected
                      ? "border-rose-500/60 bg-rose-500/15 text-rose-500"
                      : isSelected
                        ? "border-[var(--app-border-strong)] bg-[var(--app-fg)] text-[var(--app-bg)]"
                        : "border-[var(--app-border)] text-[var(--app-muted)]"
                }`}
              >
                {opt.key}
              </span>
              <span className="flex-1 leading-6">{opt.text}</span>
              {submitted && isAnswer ? <span className="text-emerald-500">✓</span> : null}
              {submitted && isSelected && !isAnswer ? (
                <span className="text-rose-500">✕</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 多选提交按钮 */}
      {isMultiple && !submitted ? (
        <div className="mt-5">
          <PrimaryBtn onClick={() => onSubmit([...local].sort())} disabled={local.length === 0}>
            {copy.submit}
          </PrimaryBtn>
        </div>
      ) : null}

      {/* 反馈 */}
      {submitted ? (
        <div
          className={`mt-5 rounded-[14px] border p-4 text-sm ${
            item!.correct
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
              : "border-rose-500/40 bg-rose-500/10 text-rose-500"
          }`}
        >
          <div className="font-semibold">{item!.correct ? copy.correctBadge : copy.wrongBadge}</div>
          {!item!.correct ? (
            <div className="mt-1 text-[var(--app-muted)]">
              {copy.answerLabel}：<span className="font-semibold text-[var(--app-fg)]">{question.answer_text}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function optionClass(submitted: boolean, isAnswer: boolean, isSelected: boolean): string {
  if (submitted) {
    if (isAnswer) return "border-emerald-500/50 bg-emerald-500/10";
    if (isSelected) return "border-rose-500/50 bg-rose-500/10";
    return "border-[var(--app-border)] bg-transparent opacity-70";
  }
  if (isSelected) return "border-[var(--app-border-strong)] bg-[var(--app-surface)]";
  return "border-[var(--app-border)] bg-[var(--app-surface)]/40 hover:border-[var(--app-border-strong)]";
}

// ===========================================================================
// 小工具组件与函数
// ===========================================================================

function SessionHeader(props: {
  copy: Copy;
  title: string;
  cursor: number;
  total: number;
  sideText: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{props.title}</h2>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          {props.copy.progress(props.cursor + 1, props.total)}
        </p>
      </div>
      <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/60 px-3 py-1 text-xs text-[var(--app-muted)]">
        {props.sideText}
      </span>
    </div>
  );
}

function PrimaryBtn(props: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--app-fg)] px-5 py-2.5 text-sm font-semibold text-[var(--app-bg)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {props.children}
    </button>
  );
}

function GhostBtn(props: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface)]/50 px-5 py-2.5 text-sm font-medium text-[var(--app-fg)] transition-all hover:bg-[var(--app-surface)]"
    >
      {props.children}
    </button>
  );
}

function NavBtn(props: { children: React.ReactNode; onClick: () => void; disabled?: boolean; ghost?: boolean }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/50 text-sm text-[var(--app-fg)] transition-all hover:bg-[var(--app-surface)] disabled:cursor-not-allowed disabled:opacity-30"
    >
      {props.children}
    </button>
  );
}

function Badge(props: { children: React.ReactNode; tone: "ok" | "bad" | "neutral" }) {
  const cls =
    props.tone === "ok"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
      : props.tone === "bad"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
        : "border-[var(--app-border)] bg-[var(--app-surface)]/60 text-[var(--app-muted)]";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {props.children}
    </span>
  );
}

function EmptyState(props: { copy: Copy; text: string; onHome: () => void }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)]/30 p-10 text-center">
      <p className="text-sm text-[var(--app-muted)]">{props.text}</p>
      <div className="mt-5">
        <GhostBtn onClick={props.onHome}>{props.copy.backHome}</GhostBtn>
      </div>
    </div>
  );
}

function typeLabel(copy: Copy, key: TypeKey): string {
  if (key === "single") return copy.typeSingle;
  if (key === "multiple") return copy.typeMultiple;
  return copy.typeTrueFalse;
}

function modeTitle(copy: Copy, mode: Session["mode"]): string {
  if (mode === "chapter") return copy.modeChapter;
  if (mode === "wrong") return copy.modeWrong;
  if (mode === "mixed") return copy.modeRandom;
  return copy.examTitle;
}
