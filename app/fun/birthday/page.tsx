"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useThemeMode } from "@/app/lib/use-theme-mode";

type Person = {
  name: string;
  date: string;
  month: number;
  day: number;
  accent: string;
  tag: string;
  mark: string;
};

const rawPeople = [
  { name: "陈嘉乐", date: "1.5", tag: "飞机/F1", mark: "✈" },
  { name: "林炯", date: "1.11", tag: "骑行 / F1", mark: "F1" },
  { name: "叶雨臻", date: "1.25" },
  { name: "陈佳燚", date: "2.3" },
  { name: "张耀远", date: "2.10" },
  { name: "爸爸", date: "2.14", tag: "Family", mark: "♥" },
  { name: "黄磊", date: "2.18" },
  { name: "周凯琦", date: "3.8", tag: "羽毛球/F1", mark: "🏸" },
  { name: "方淳熠", date: "3.15" },
  { name: "骆锦伊", date: "3.18", tag: "苹果", mark: "🍎" },
  { name: "杨承", date: "3.23" },
  { name: "黄俊涛", date: "3.25" },
  { name: "褚闻新", date: "3.27", tag: "方大同" },
  { name: "高欣", date: "3.30" },
  { name: "严毅天", date: "3.30" },
  { name: "卢泽睿", date: "3.30" },
  { name: "陈晨", date: "4.18" },
  { name: "何正韬", date: "5.4" },
  { name: "郎宸凯", date: "5.17", tag: "排球", mark: "🏐" },
  { name: "张明月", date: "5.23" },
  { name: "张馨悦", date: "5.28", tag: "Family" },
  { name: "于萧阳", date: "6.10" },
  { name: "蔡夏亮", date: "7.4" },
  { name: "童忠焜", date: "7.8", tag: "哆啦A梦", mark: "🔔" },
  { name: "张航宁", date: "7.22", tag: "哈登", mark: "13" },
  { name: "刘奕楠", date: "7.23", tag: "足球", mark: "⚽" },
  { name: "吴宇凯", date: "7.26" },
  { name: "周伴星", date: "7.26", tag: "曼城", mark: "MC" },
  { name: "叶思铖", date: "7.26", tag: "利物浦", mark: "LIV" },
  { name: "王彬灵", date: "8.28", tag: "蔡徐坤", mark: "KUN" },
  { name: "吴罡祺", date: "9.5", tag: "曼城", mark: "MC" },
  { name: "王瀚宇", date: "9.13" },
  { name: "王赫俊", date: "9.18" },
  { name: "王佳诺", date: "9.26" },
  { name: "王赛", date: "9.29", tag: "486" },
  { name: "丁欣怡", date: "10.10" },
  { name: "妈妈", date: "10.21", tag: "Family", mark: "♥" },
  { name: "徐晨萧", date: "10.25" },
  { name: "曹向", date: "11.8" },
  { name: "陈立航", date: "11.16" },
  { name: "严天秀", date: "11.27" },
  { name: "顾婧怡", date: "12.1" },
  { name: "俞越", date: "12.19" },
  { name: "沈锦翌", date: "12.31" },
];

const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const monthFull = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const palette = ["#8bdcff", "#ff8a3d", "#f472b6", "#a78bfa", "#34d399", "#facc15", "#fb7185", "#60a5fa", "#c084fc", "#2dd4bf", "#f97316", "#e879f9"];

function parseDate(date: string) {
  const [month, day] = date.split(".").map(Number);
  return { month, day };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function keyOf(month: number, day: number) {
  return `${month}-${day}`;
}

function getInitial(name: string) {
  if (name === "妈妈") return "妈";
  if (name === "爸爸") return "爸";
  return name.slice(-1);
}

function daysUntil(month: number, day: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), month - 1, day);

  if (target < today) {
    target = new Date(now.getFullYear() + 1, month - 1, day);
  }

  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function buildCalendarCells(month: number, year: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

const people = rawPeople.map((item, index) => {
  const { month, day } = parseDate(item.date);
  return {
    ...item,
    month,
    day,
    accent: palette[(month * 7 + day + index) % palette.length],
    tag: item.tag || "Birthday",
    mark: item.mark || getInitial(item.name),
  };
});

function MonthStrip({
  selectedMonth,
  setSelectedMonth,
  birthdaysByMonth,
}: {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  birthdaysByMonth: Record<number, Person[]>;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-3 backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12">
        {monthNames.map((month, index) => {
          const value = index + 1;
          const active = value === selectedMonth;
          const count = birthdaysByMonth[value]?.length || 0;

          return (
            <button
              key={month}
              type="button"
              onClick={() => setSelectedMonth(value)}
              className={`relative flex h-14 flex-col items-center justify-center rounded-[18px] border text-xs font-medium tracking-[0.24em] transition-colors ${active
                ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-fg)]"
                : "border-transparent text-[var(--app-muted)] hover:border-[var(--app-border)] hover:bg-[var(--app-surface)]/80"
                }`}
            >
              <span>{month}</span>
              <span className={`mt-1 text-[10px] tracking-[0.12em] ${active ? "opacity-70" : "opacity-80"}`}>{count || " "}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthGroup({
  month,
  records,
  selectedPerson,
  onSelectPerson,
}: {
  month: number;
  records: Person[];
  selectedPerson: Person;
  onSelectPerson: (person: Person) => void;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/45 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-[0.22em] text-[var(--app-muted)]">{monthNames[month - 1]}</h3>
        <div className="h-px flex-1 bg-[var(--app-border)]" />
      </div>
      <div className="space-y-2">
        {records.map((person) => (
          <button
            key={`${person.name}-${person.date}`}
            type="button"
            onClick={() => onSelectPerson(person)}
            className={`flex w-full items-center justify-between rounded-[18px] px-3 py-2 text-left transition-colors ${selectedPerson.name === person.name ? "bg-[var(--app-surface)]" : "hover:bg-[var(--app-surface)]/70"
              }`}
          >
            <span className="truncate text-sm font-medium">{person.name}</span>
            <span className="shrink-0 text-xs text-[var(--app-muted)]">{pad(person.day)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PasswordLock({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(8).fill(""));
  const [shake, setShake] = useState(false);
  const [failed, setFailed] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      const allFilled = next.every((d) => d !== "");

      if (allFilled && next.join("") === "20060523") {
        setTimeout(() => onUnlock(), 100);
      } else if (allFilled) {
        setTimeout(() => {
          setShake(true);
          setFailed(true);
          setTimeout(() => {
            setShake(false);
            setDigits(Array(8).fill(""));
            setFailed(false);
            refs.current[0]?.focus();
          }, 600);
        }, 50);
      }

      return next;
    });
    setFailed(false);

    if (digit && index < 7) {
      refs.current[index + 1]?.focus();
    }
  }, [onUnlock]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    const next = [...Array(8).fill(""), ...text.split("")].slice(0, 8);
    while (next.length < 8) next.push("");
    setDigits(next);
    if (next.join("") === "20060523") {
      setTimeout(() => onUnlock(), 100);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className={`text-center ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--app-muted)]">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className="mb-8 text-sm tracking-[0.2em] text-[var(--app-muted)]">输入密码以继续</p>
        <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
          {[4, 2, 2].map((group, gi) => (
            <div key={gi} className="flex items-center gap-3">
              {Array.from({ length: group }, (_, i) => {
                const index = gi === 0 ? i : gi === 1 ? 4 + i : 6 + i;
                const filled = digits[index] !== "";
                return (
                  <div key={index} className="relative">
                    <div
                      className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 text-xl font-semibold transition-all duration-200 sm:h-16 sm:w-14 ${filled
                        ? failed
                          ? "border-red-500/60 bg-red-500/10 text-red-400"
                          : "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-fg)]"
                        : "border-[var(--app-border)] bg-[var(--app-surface)]/50 text-[var(--app-fg)]"
                        }`}
                    >
                      {filled ? (
                        <span className="text-2xl">{digits[index]}</span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-[var(--app-muted)]/30" />
                      )}
                    </div>
                    <input
                      ref={(el) => { refs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digits[index]}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      autoFocus={index === 0}
                    />
                  </div>
                );
              })}
              {gi < 2 && <span className="mx-1 text-[var(--app-border-strong)]">-</span>}
            </div>
          ))}
        </div>
        {failed && <p className="mt-6 text-xs tracking-wider text-red-400">密码错误，请重试</p>}
      </div>
    </div>
  );
}

export default function BirthdayPage() {
  const { language } = useSiteLanguage();
  const theme = useThemeMode();
  const [unlocked, setUnlocked] = useState(false);

  const sorted = useMemo(
    () => [...people].sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name, "zh-Hans-CN")),
    []
  );

  const birthdaysByDate = useMemo(() => {
    return sorted.reduce<Record<string, Person[]>>((acc, person) => {
      const key = keyOf(person.month, person.day);
      acc[key] = acc[key] || [];
      acc[key].push(person);
      return acc;
    }, {});
  }, [sorted]);

  const birthdaysByMonth = useMemo(() => {
    return sorted.reduce<Record<number, Person[]>>((acc, person) => {
      acc[person.month] = acc[person.month] || [];
      acc[person.month].push(person);
      return acc;
    }, {});
  }, [sorted]);

  const upcoming = useMemo(() => [...sorted].sort((a, b) => daysUntil(a.month, a.day) - daysUntil(b.month, b.day)), [sorted]);

  const [selectedPerson, setSelectedPerson] = useState<Person>(upcoming[0]);
  const [selectedMonth, setSelectedMonth] = useState<number>(upcoming[0].month);
  const selectedKey = keyOf(selectedPerson.month, selectedPerson.day);
  const sameDateRecords = birthdaysByDate[selectedKey] || [selectedPerson];
  const monthRecords = birthdaysByMonth[selectedMonth] || [];
  const sceneClass =
    theme === "light"
      ? "bg-[radial-gradient(circle_at_20%_15%,rgba(24,21,19,0.08),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(24,21,19,0.06),transparent_24%),linear-gradient(180deg,rgba(255,248,236,0.78),rgba(245,241,232,0.98))]"
      : "bg-[radial-gradient(circle_at_20%_15%,rgba(148,163,184,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.05),transparent_24%),linear-gradient(180deg,rgba(5,5,5,0.82),rgba(5,5,5,1))]";

  const copy =
    language === "en"
      ? {
        label: "Entertainment",
        title: "Birthday",
        description: "A compact birthday board that stays in step with the rest of the site.",
        backToFun: "Back to fun",
        detail: "Detail",
        upcoming: "Next birthdays",
        monthList: "Month list",
        allRecords: "All records",
        daysLeft: "Days left",
        birthdayTag: "Birthday",
      }
      : {
        label: "Entertainment",
        title: "Birthday",
        description: "",
        backToFun: "返回娱乐页",
        detail: "生日详情",
        upcoming: "接下来生日",
        monthList: "本月列表",
        allRecords: "全部记录",
        daysLeft: "距离生日",
        birthdayTag: "生日",
      };

  if (!unlocked) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300">
        <PasswordLock onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300">
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${sceneClass}`} />

      <section className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-2xl">
          <div className="mb-10 space-y-3">
            <Link
              href="/fun"
              className="inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
            >
              {copy.backToFun}
            </Link>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.label}</p>
          </div>

          <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-7xl">{copy.title}</h1>
          {copy.description ? <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--app-muted)] md:text-base">{copy.description}</p> : null}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-20">
        <MonthStrip selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} birthdaysByMonth={birthdaysByMonth} />

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.monthList}</p>
                <h2 className="mt-2 text-4xl font-semibold tracking-tight">{monthFull[selectedMonth - 1]}</h2>
              </div>
              <p className="text-sm text-[var(--app-muted)]">{monthRecords.length}</p>
            </div>

            <div className="grid grid-cols-7 gap-2 pb-2">
              {weekdays.map((day) => (
                <div key={day} className="px-2 py-1 text-center text-[10px] font-medium tracking-[0.2em] text-[var(--app-muted)]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {buildCalendarCells(selectedMonth, new Date().getFullYear()).map((day, index) => {
                if (!day) {
                  return <div key={`blank-${index}`} className="min-h-[76px] rounded-[20px] border border-transparent" />;
                }

                const records = birthdaysByDate[keyOf(selectedMonth, day)] || [];
                const hasRecords = records.length > 0;
                const active = selectedKey === keyOf(selectedMonth, day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => hasRecords && setSelectedPerson(records[0])}
                    disabled={!hasRecords}
                    className={`group relative min-h-[76px] rounded-[20px] border p-2 text-left transition-colors ${active
                      ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-fg)]"
                      : hasRecords
                        ? "border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)]/90"
                        : "border-[var(--app-border)]/50 bg-transparent text-[var(--app-muted)]/45"
                      }`}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {hasRecords ? (
                      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                        {records.slice(0, 4).map((record) => (
                          <span
                            key={record.name}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: record.accent }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.upcoming}</p>
              <div className="mt-4 space-y-2">
                {upcoming.slice(0, 6).map((person, index) => (
                  <button
                    key={`${person.name}-${person.date}`}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(person.month);
                      setSelectedPerson(person);
                    }}
                    className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition-colors ${person.name === selectedPerson.name
                      ? "border-[var(--app-border-strong)] bg-[var(--app-surface)]"
                      : "border-[var(--app-border)] bg-transparent hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)]/80"
                      }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold tracking-tight">{person.name}</div>
                      <div className="mt-1 text-xs text-[var(--app-muted)]">
                        {pad(person.month)}.{pad(person.day)} · {person.tag}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm text-[var(--app-muted)]">
                      {index === 0 ? "Next" : `${daysUntil(person.month, person.day)} d`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.detail}</p>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-6xl font-semibold leading-none tracking-tight">{pad(selectedPerson.day)}</div>
                  <div className="mt-3 text-sm uppercase tracking-[0.25em] text-[var(--app-muted)]">{monthNames[selectedPerson.month - 1]}</div>
                </div>
                <div
                  className="flex h-16 min-w-16 items-center justify-center rounded-[24px] border border-[var(--app-border)] text-2xl font-semibold"
                  style={{ color: selectedPerson.accent }}
                >
                  {selectedPerson.mark}
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--app-border)] pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-2xl font-semibold tracking-tight">{selectedPerson.name}</div>
                    <div className="mt-1 text-sm text-[var(--app-muted)]">{selectedPerson.tag || copy.birthdayTag}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.daysLeft}</div>
                    <div className="mt-2 text-4xl font-semibold tracking-tight">{daysUntil(selectedPerson.month, selectedPerson.day)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {sameDateRecords.map((person) => (
                  <button
                    key={`${person.name}-${person.date}`}
                    type="button"
                    onClick={() => setSelectedPerson(person)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${person.name === selectedPerson.name
                      ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-fg)]"
                      : "border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
                      }`}
                  >
                    {person.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="h-px bg-[var(--app-border)]" />
          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.allRecords}</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(birthdaysByMonth).map(([month, records]) => (
            <MonthGroup
              key={month}
              month={Number(month)}
              records={records}
              selectedPerson={selectedPerson}
              onSelectPerson={(person) => {
                setSelectedMonth(person.month);
                setSelectedPerson(person);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
