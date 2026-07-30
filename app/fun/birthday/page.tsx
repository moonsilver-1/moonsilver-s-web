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
  zodiac: string;
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
  { name: "黄崇峻", date: "10.14" },
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

function getZodiac(month: number, day: number): string {
  const boundaries = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];
  const signs = ["水瓶座", "双鱼座", "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座"];
  if (day < boundaries[month - 1]) {
    return signs[(month + 10) % 12];
  }
  return signs[month - 1];
}

const monthAccent = [
  "#a8b5c4", "#c49a8a", "#9ab4a6", "#a5b5a0", "#a8c4b8", "#c9a87c",
  "#d4b896", "#c4b896", "#d4a5a5", "#d4b0a0", "#a0a8b8", "#b8a9c9",
];

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

const people = rawPeople.map((item) => {
  const { month, day } = parseDate(item.date);
  return {
    ...item,
    month,
    day,
    accent: monthAccent[month - 1],
    tag: item.tag || "Birthday",
    mark: item.mark || getInitial(item.name),
    zodiac: getZodiac(month, day),
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
            className={`relative flex w-full items-center justify-between rounded-[18px] px-3 py-2 text-left transition-colors ${selectedPerson.name === person.name ? "bg-[var(--app-surface)]" : "hover:bg-[var(--app-surface)]/70"
              }`}
          >
            <span
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full transition-opacity"
              style={{
                backgroundColor: person.accent,
                opacity: selectedPerson.name === person.name ? 1 : 0,
              }}
            />
            <span className="truncate pl-1.5 text-sm font-medium">{person.name}</span>
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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/80">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#c9a87c]/70">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>
        <p className="mb-2 text-lg font-medium text-[var(--app-fg)]">这个小空间需要一点秘密</p>
        <p className="mb-8 text-sm text-[var(--app-muted)]">输入生日密码就可以进来啦</p>
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
      ? "bg-[radial-gradient(circle_at_22%_14%,rgba(201,168,124,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(196,154,138,0.08),transparent_24%),linear-gradient(180deg,rgba(250,247,242,0.95),rgba(245,241,232,0.98))]"
      : "bg-[radial-gradient(circle_at_22%_14%,rgba(201,168,124,0.10),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(196,154,138,0.06),transparent_24%),linear-gradient(180deg,rgba(12,10,8,0.95),rgba(8,6,5,1))]";

  const copy =
    language === "en"
      ? {
        label: "Fun",
        title: "Birthdays",
        description: "Every year is worth celebrating",
        backToFun: "Back",
        detail: "About",
        upcoming: "Coming soon",
        monthList: "Calendar",
        allRecords: "Everyone",
        daysLeft: "In",
        birthdayTag: "Friend",
        zodiacLabel: "Zodiac",
      }
      : {
        label: "娱乐",
        title: "生日",
        description: "记得给重要的人说一句生日快乐",
        backToFun: "返回",
        detail: "档案",
        upcoming: "快要过生日啦",
        monthList: "日历",
        allRecords: "所有人",
        daysLeft: "还有",
        birthdayTag: "朋友",
        zodiacLabel: "星座",
      };

  if (!unlocked) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300">
        <PasswordLock onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300 page-enter">
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
          <div className="overflow-hidden rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/60 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.monthList}</p>
                <h2 className="mt-2 text-4xl font-semibold tracking-tight">{monthFull[selectedMonth - 1]}</h2>
              </div>
              <p className="text-sm text-[var(--app-muted)]">{monthRecords.length} 位</p>
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
                    className={`group relative min-h-[76px] rounded-[20px] border p-2 text-left transition-all duration-300 ${active
                      ? "bg-[var(--app-surface)] shadow-sm"
                      : hasRecords
                        ? "border-[var(--app-border)] bg-[var(--app-surface)] hover:border-[var(--app-border-strong)] hover:shadow-sm"
                        : "border-transparent bg-transparent text-[var(--app-muted)]/40"
                      }`}
                    style={active ? { borderColor: records[0]?.accent } : {}}
                  >
                    <span className="text-sm font-medium" style={active ? { color: records[0]?.accent } : {}}>{day}</span>
                    {hasRecords ? (
                      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                        {records.slice(0, 4).map((record) => (
                          <span
                            key={record.name}
                            className="h-2 w-2 rounded-full"
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
            <div className="overflow-hidden rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/60 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
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
                    className={`relative flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition-all duration-300 ${person.name === selectedPerson.name
                      ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] shadow-sm"
                      : "border-[var(--app-border)] bg-transparent hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)]/80"
                      }`}
                  >
                    <div
                      className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full opacity-0 transition-opacity duration-300"
                      style={{ backgroundColor: person.accent, opacity: person.name === selectedPerson.name ? 1 : 0 }}
                    />
                    <div className="min-w-0 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-tight">{person.name}</span>
                        {index === 0 && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ color: person.accent, backgroundColor: `${person.accent}18` }}
                          >
                            SOON
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-[var(--app-muted)]">
                        {pad(person.month)}.{pad(person.day)} · {person.zodiac} · {person.tag}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm text-[var(--app-muted)]">
                      {index === 0 ? "快到了" : `${daysUntil(person.month, person.day)} 天`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/60 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.detail}</p>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-6xl font-semibold leading-none tracking-tight">{pad(selectedPerson.day)}</div>
                  <div className="mt-3 text-sm uppercase tracking-[0.25em] text-[var(--app-muted)]">{monthNames[selectedPerson.month - 1]}</div>
                </div>
                <div
                  className="flex h-16 min-w-16 items-center justify-center rounded-[24px] border text-2xl font-semibold"
                  style={{
                    color: selectedPerson.accent,
                    borderColor: `${selectedPerson.accent}30`,
                    backgroundColor: `${selectedPerson.accent}12`,
                  }}
                >
                  {selectedPerson.mark}
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--app-border)] pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-2xl font-semibold tracking-tight">{selectedPerson.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-[var(--app-muted)]">
                      <span
                        className="inline-block rounded-md px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          color: selectedPerson.accent,
                          backgroundColor: `${selectedPerson.accent}15`,
                        }}
                      >
                        {selectedPerson.zodiac}
                      </span>
                      <span>·</span>
                      <span>{selectedPerson.tag || copy.birthdayTag}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.daysLeft}</div>
                    <div className="mt-2 text-4xl font-semibold tracking-tight">{daysUntil(selectedPerson.month, selectedPerson.day)}</div>
                    <div className="text-xs text-[var(--app-muted)]">天</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {sameDateRecords.map((person) => (
                  <button
                    key={`${person.name}-${person.date}`}
                    type="button"
                    onClick={() => setSelectedPerson(person)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-300 ${person.name === selectedPerson.name
                      ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-fg)] shadow-sm"
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
