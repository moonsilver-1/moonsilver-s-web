"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import SearchBar from "@/app/components/search-bar";
import { useSiteLanguage } from "@/app/components/language-provider";
import type { Story } from "@/app/lib/story-content";
import MoonlitMemoryRainStory from "./moonlit-memory-rain-story";
import StoryMusicPlayer from "./story-music-player";
import CinematicReader from "./cinematic-reader";

type StoryVolume = {
  id: string;
  title: string;
  summary: string;
  chapters: Story["chapters"];
};

type StoryReaderClientProps = Record<string, never>;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildStoryVolume(story: Story): StoryVolume {
  const firstChapter = story.chapters[0];

  return {
    id: story.id,
    title: story.title,
    summary: firstChapter?.excerpt || story.paragraphs[0] || "",
    chapters: story.chapters,
  };
}

function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const context = canvasElement.getContext("2d");
    if (!context) return;

    const canvas = canvasElement;
    const ctx = context;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationId = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const drops: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      drift: number;
      width: number;
    }> = [];
    const ripples: Array<{ x: number; y: number; radius: number; opacity: number }> = [];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drops.length = 0;
      const count = Math.floor(width / 7);
      for (let i = 0; i < count; i += 1) {
        drops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 14 + Math.random() * 28,
          speed: 8 + Math.random() * 9,
          opacity: 0.16 + Math.random() * 0.32,
          drift: -1.5 - Math.random() * 1.2,
          width: 0.7 + Math.random() * 0.8,
        });
      }
    }

    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#08111f");
      gradient.addColorStop(0.45, "#111827");
      gradient.addColorStop(1, "#172033");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
      for (let i = 0; i < 80; i += 1) {
        const x = (i * 137.5) % width;
        const y = (i * 91.7) % height;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 0.9 + 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      drawBackground();

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (const drop of drops) {
        const endX = drop.x + drop.drift * 3;
        const endY = drop.y + drop.length;

        const lineGradient = ctx.createLinearGradient(drop.x, drop.y, endX, endY);
        lineGradient.addColorStop(0, "rgba(170, 210, 255, 0)");
        lineGradient.addColorStop(0.35, `rgba(170, 210, 255, ${drop.opacity * 0.38})`);
        lineGradient.addColorStop(1, `rgba(210, 230, 255, ${drop.opacity})`);

        ctx.beginPath();
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = drop.width;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x += drop.drift;

        if (drop.y > height - 32) {
          if (Math.random() > 0.62) {
            ripples.push({
              x: drop.x,
              y: height - 32 + Math.random() * 10,
              radius: 1,
              opacity: 0.22,
            });
          }
          drop.y = -drop.length;
          drop.x = Math.random() * width;
        }

        if (drop.x < -40) {
          drop.x = width + 40;
        }
      }

      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const ripple = ripples[i];
        ctx.beginPath();
        ctx.ellipse(ripple.x, ripple.y, ripple.radius * 2.6, ripple.radius * 0.58, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(190, 220, 255, ${ripple.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ripple.radius += 0.42;
        ripple.opacity -= 0.01;
        if (ripple.opacity <= 0) ripples.splice(i, 1);
      }

      ctx.restore();
      animationId = window.requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden="true" />;
}

export default function StoryReaderClient() {
  const { language } = useSiteLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"text" | "cinematic">("text");
  const [authLoading, setAuthLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  const storyVolumes = useMemo(() => stories.map(buildStoryVolume), [stories]);

  useEffect(() => {
    const previousTheme = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = "dark";
    window.localStorage.setItem("site-theme", "dark");

    return () => {
      if (previousTheme === "light" || previousTheme === "dark") {
        document.documentElement.dataset.theme = previousTheme;
        window.localStorage.setItem("site-theme", previousTheme);
      }
    };
  }, []);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem("story-token");
    if (!savedToken) return;

    setContentLoading(true);
    fetch("/api/story-content", {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          sessionStorage.removeItem("story-token");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.stories) {
          setToken(savedToken);
          setStories(data.stories);
          setIsUnlocked(true);
        }
      })
      .catch(() => {
        sessionStorage.removeItem("story-token");
      })
      .finally(() => {
        setContentLoading(false);
      });
  }, []);

  const copy =
    language === "en"
      ? {
          search: "Search stories...",
          unlock: "Enter",
          unlockPlaceholder: "Password",
          unlockError: "Wrong password.",
          empty: "No matching stories.",
          backToFun: "Back to fun",
          backToList: "Back",
        }
      : {
          search: "搜索故事...",
          unlock: "进入",
          unlockPlaceholder: "密码",
          unlockError: "密码不对。",
          empty: "没有找到匹配的故事。",
          backToFun: "返回 fun",
          backToList: "返回",
        };

  const filteredStories = useMemo(() => {
    const query = normalize(searchQuery);

    if (!query) {
      return storyVolumes;
    }

    return storyVolumes.filter((item) => [item.title, item.summary].join(" ").toLowerCase().includes(query));
  }, [searchQuery, storyVolumes]);

  const activeStory = activeStoryId ? storyVolumes.find((item) => item.id === activeStoryId) ?? null : null;
  const activeStorySource = activeStoryId ? stories.find((item) => item.id === activeStoryId) ?? null : null;

  useEffect(() => {
    setViewMode("text");
  }, [activeStoryId]);
  const storyTitle = activeStory?.title ?? storyVolumes[0]?.title ?? "dxy";

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim()) return;

    setAuthLoading(true);
    setPasswordError("");

    try {
      const authResponse = await fetch("/api/story-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok || !authData.token) {
        setPasswordError(authData.error || copy.unlockError);
        return;
      }

      const newToken = authData.token;
      setToken(newToken);
      sessionStorage.setItem("story-token", newToken);
      setPassword("");
      setIsUnlocked(true);

      // Fetch stories with the token
      setContentLoading(true);
      try {
        const contentResponse = await fetch("/api/story-content", {
          headers: { Authorization: `Bearer ${newToken}` },
        });

        if (!contentResponse.ok) {
          setIsUnlocked(false);
          setToken(null);
          sessionStorage.removeItem("story-token");
          setPasswordError(copy.unlockError);
          return;
        }

        const contentData = await contentResponse.json();
        setStories(contentData.stories || []);
      } catch {
        setIsUnlocked(false);
        setToken(null);
        sessionStorage.removeItem("story-token");
        setPasswordError(copy.unlockError);
      } finally {
        setContentLoading(false);
      }
    } catch {
      setPasswordError(copy.unlockError);
    } finally {
      setAuthLoading(false);
    }
  }

  if (!isUnlocked) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 pt-28 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(148,163,184,0.18),transparent_34%),linear-gradient(to_bottom,rgba(2,6,23,0.08),rgba(2,6,23,0.7))]" />
        <RainBackground />

        <section className="relative z-10 mx-auto flex min-h-[58vh] max-w-xl flex-col justify-center">
          <form className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-md" onSubmit={handleUnlock}>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError("");
              }}
              placeholder={copy.unlockPlaceholder}
              className="w-full rounded-[16px] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-white/45 outline-none transition-colors focus:border-white/25"
            />
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="min-h-5 text-sm text-rose-200">{passwordError}</p>
              <button
                type="submit"
                disabled={authLoading}
                className="shrink-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-50"
              >
                {authLoading ? "..." : copy.unlock}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  if (contentLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 pt-28 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(148,163,184,0.18),transparent_34%),linear-gradient(to_bottom,rgba(2,6,23,0.08),rgba(2,6,23,0.7))]" />
        <div className="relative z-10 mx-auto max-w-xl px-6 py-20 text-center">
          <p className="text-sm text-white/60">Loading...</p>
        </div>
      </main>
    );
  }

  if (activeStory) {
    if (activeStory.id === "雨的尽头是海" && activeStorySource) {
      return (
        <>
          {viewMode === "cinematic" ? (
            <CinematicReader story={activeStorySource} onExit={() => setViewMode("text")} />
          ) : (
            <MoonlitMemoryRainStory
              story={activeStorySource}
              onBackToList={() => setActiveStoryId(null)}
              onSwitchToCinematic={() => setViewMode("cinematic")}
            />
          )}
          <StoryMusicPlayer />
        </>
      );
    }

    return (
      <main className="relative min-h-screen bg-slate-950 pt-20 text-white">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(148,163,184,0.12),transparent_34%),linear-gradient(to_bottom,rgba(2,6,23,0.08),rgba(2,6,23,0.78))]" />
        <RainBackground />

        <article className="relative z-10 mx-auto max-w-5xl px-6 py-14 md:py-20">
          <div className="mb-10 flex flex-wrap items-center gap-2 text-xs text-white/55">
            <button
              type="button"
              onClick={() => setActiveStoryId(null)}
              className="rounded-full border border-white/10 px-3 py-1 transition-colors hover:border-white/25 hover:text-white"
            >
              {copy.backToList}
            </button>
            <Link href="/fun" className="rounded-full border border-white/10 px-3 py-1 transition-colors hover:border-white/25 hover:text-white">
              {copy.backToFun}
            </Link>
          </div>

          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">{storyTitle}</h1>

          <div className="mt-12 space-y-12">
            {activeStory.chapters.map((chapter) => (
              <section key={chapter.id} className="space-y-5">
                <div className="border-t border-white/10 pt-8">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-white/35">{chapter.chapterLabel}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">{chapter.title}</h2>
                  {chapter.period ? <p className="mt-2 text-sm text-white/55">{chapter.period}</p> : null}
                </div>

                <div className="space-y-5">
                  {chapter.paragraphs.map((paragraph, index) => (
                    <p key={`${chapter.id}-${index}`} className="text-base leading-8 text-white/88 md:text-lg md:leading-9">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
        <StoryMusicPlayer />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 pt-20 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(148,163,184,0.12),transparent_34%),linear-gradient(to_bottom,rgba(2,6,23,0.08),rgba(2,6,23,0.78))]" />
      <RainBackground />

      <section className="relative z-10 mx-auto max-w-2xl px-6 py-20">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
          <Link href="/fun" className="rounded-full border border-white/10 px-3 py-1 transition-colors hover:border-white/25 hover:text-white">
            {copy.backToFun}
          </Link>
        </div>

        <div className="mt-12">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={copy.search} />
        </div>

        <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.05] p-2 backdrop-blur-md">
          {filteredStories.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2">
              {filteredStories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveStoryId(item.id)}
                  className="rounded-[16px] border border-white/10 bg-slate-900/70 px-4 py-4 text-left transition-colors hover:border-white/25 hover:bg-slate-800/80"
                >
                    <span className="text-2xl font-semibold tracking-tight text-white">{item.title}</span>
                  </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-white/55">{copy.empty}</div>
          )}
        </div>
      </section>
      <StoryMusicPlayer />
    </main>
  );
}
