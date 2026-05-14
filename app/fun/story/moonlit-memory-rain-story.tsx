"use client";

import type { Story } from "@/app/lib/story-content";
import { useEffect, useMemo, useRef } from "react";

type MoonlitMemoryRainStoryProps = {
  story: Story;
  onBackToList: () => void;
  onSwitchToCinematic?: () => void;
};

type EpisodeView = {
  id: string;
  label: string;
  title: string;
  period: string;
  paragraphs: string[];
};

function useMoonlitBackground(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const element = canvas;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let raf = 0;
    const mouse = { x: -9999, y: -9999 };

    const codes = ["0xA5B9", "42425", "DXY", "moonsilver", "010010", "return memory;"];
    const rain: Array<{ x: number; y: number; len: number; speed: number; alpha: number; drift: number; thick: number }> = [];
    const petals: Array<{ x: number; y: number; s: number; vx: number; vy: number; a: number; phase: number }> = [];
    const ghosts: Array<{ x: number; y: number; t: string; a: number; size: number; life: number; max: number }> = [];
    const droplets: Array<{ x: number; y: number; len: number; speed: number; a: number }> = [];

    function resize() {
      const rect = element.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      element.width = Math.floor(width * dpr);
      element.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      rain.length = 0;
      petals.length = 0;
      ghosts.length = 0;
      droplets.length = 0;

      const rainCount = Math.floor(width / 5.4);
      for (let i = 0; i < rainCount; i += 1) {
        rain.push({
          x: Math.random() * width,
          y: Math.random() * height,
          len: 18 + Math.random() * 46,
          speed: 5.2 + Math.random() * 8.6,
          alpha: 0.05 + Math.random() * 0.18,
          drift: -1.2 - Math.random() * 1.5,
          thick: Math.random() > 0.88 ? 1.2 : 0.55,
        });
      }

      for (let i = 0; i < 38; i += 1) {
        petals.push({
          x: Math.random() * width,
          y: Math.random() * height,
          s: 1.2 + Math.random() * 3.2,
          vx: -0.22 + Math.random() * 0.5,
          vy: 0.24 + Math.random() * 0.7,
          a: 0.12 + Math.random() * 0.34,
          phase: Math.random() * Math.PI * 2,
        });
      }

      for (let i = 0; i < 12; i += 1) {
        ghosts.push({
          x: Math.random() * width,
          y: 90 + Math.random() * (height * 0.56),
          t: codes[Math.floor(Math.random() * codes.length)],
          a: 0.018 + Math.random() * 0.052,
          size: 10 + Math.random() * 8,
          life: 160 + Math.random() * 520,
          max: 280 + Math.random() * 520,
        });
      }

      for (let i = 0; i < 18; i += 1) {
        droplets.push({
          x: Math.random() * width,
          y: Math.random() * height,
          len: 24 + Math.random() * 130,
          speed: 0.22 + Math.random() * 0.9,
          a: 0.035 + Math.random() * 0.12,
        });
      }
    }

    function background() {
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "#070b12");
      g.addColorStop(0.38, "#0a1320");
      g.addColorStop(0.7, "#101c2c");
      g.addColorStop(1, "#03060c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      const moonX = width * 0.74;
      const moonY = height * 0.18;
      const glow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, width * 0.38);
      glow.addColorStop(0, "rgba(225,235,248,0.34)");
      glow.addColorStop(0.18, "rgba(185,205,232,0.16)");
      glow.addColorStop(0.44, "rgba(80,105,135,0.08)");
      glow.addColorStop(1, "rgba(20,30,45,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(moonX, moonY, Math.max(42, width * 0.045), 0, Math.PI * 2);
      const moon = ctx.createRadialGradient(moonX - 14, moonY - 10, 4, moonX, moonY, width * 0.06);
      moon.addColorStop(0, "rgba(255,255,255,0.95)");
      moon.addColorStop(0.58, "rgba(205,218,235,0.62)");
      moon.addColorStop(1, "rgba(180,200,222,0.12)");
      ctx.fillStyle = moon;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "rgba(3,7,12,0.76)";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.63);
      for (let x = 0; x <= width; x += 40) {
        const y = height * 0.62 + Math.sin(x * 0.011) * 22 + Math.sin(x * 0.023) * 9;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const seaY = height * 0.64;
      const sea = ctx.createLinearGradient(0, seaY, 0, height);
      sea.addColorStop(0, "rgba(6,14,25,0.36)");
      sea.addColorStop(0.52, "rgba(9,20,34,0.88)");
      sea.addColorStop(1, "rgba(2,5,9,0.98)");
      ctx.fillStyle = sea;
      ctx.fillRect(0, seaY, width, height - seaY);

      for (let i = 0; i < 36; i += 1) {
        const yy = seaY + i * 9 + Math.sin(frame * 0.014 + i) * 4;
        const alpha = 0.04 + (i / 36) * 0.05;
        ctx.strokeStyle = `rgba(150,185,220,${alpha})`;
        ctx.lineWidth = i % 7 === 0 ? 1.4 : 0.55;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 18) {
          const y = yy + Math.sin(x * 0.018 + frame * 0.018 + i) * (4 + i * 0.11);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      const reflect = ctx.createRadialGradient(moonX, height * 0.76, 0, moonX, height * 0.76, width * 0.26);
      reflect.addColorStop(0, "rgba(210,230,255,0.32)");
      reflect.addColorStop(0.28, "rgba(140,180,220,0.16)");
      reflect.addColorStop(0.62, "rgba(80,120,160,0.07)");
      reflect.addColorStop(1, "rgba(40,70,110,0)");
      ctx.fillStyle = reflect;
      ctx.fillRect(0, seaY, width, height - seaY);
    }

    function drawRain() {
      const mx = mouse.x;
      const my = mouse.y;
      for (const r of rain) {
        const dx = r.x - mx;
        const dy = r.y - my;
        const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 190);
        ctx.strokeStyle = `rgba(200,220,245,${r.alpha + glow * 0.22})`;
        ctx.lineWidth = r.thick;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.drift * 2.2, r.y + r.len);
        ctx.stroke();
        r.x += r.drift;
        r.y += r.speed;
        if (r.y > height + 80 || r.x < -100) {
          r.x = Math.random() * width + 60;
          r.y = -90;
        }
      }
    }

    function drawPetals() {
      for (const p of petals) {
        p.phase += 0.018;
        p.x += p.vx + Math.sin(p.phase) * 0.18;
        p.y += p.vy;
        if (p.y > height + 20 || p.x < -40 || p.x > width + 40) {
          p.x = Math.random() * width;
          p.y = -20;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.phase) * 1.2);
        ctx.fillStyle = `rgba(222,174,63,${p.a})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s * 1.7, p.s * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawGhostCodes() {
      ctx.save();
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      for (const g of ghosts) {
        const pulse = Math.sin((g.life / g.max) * Math.PI);
        ctx.globalAlpha = g.a * Math.max(0.18, pulse);
        ctx.fillStyle = "#cfddf2";
        ctx.font = `${g.size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        ctx.fillText(g.t, g.x, g.y);
        g.life -= 1;
        if (g.life <= 0) {
          g.x = Math.random() * width;
          g.y = 90 + Math.random() * (height * 0.58);
          g.t = codes[Math.floor(Math.random() * codes.length)];
          g.life = 240 + Math.random() * 520;
          g.max = g.life;
          g.a = 0.018 + Math.random() * 0.052;
        }
      }
      ctx.restore();
    }

    function drawGlass() {
      for (const d of droplets) {
        const grd = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.len);
        grd.addColorStop(0, "rgba(255,255,255,0)");
        grd.addColorStop(0.18, `rgba(215,230,245,${d.a})`);
        grd.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grd;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.bezierCurveTo(d.x + 4, d.y + d.len * 0.25, d.x - 3, d.y + d.len * 0.62, d.x + 2, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        if (d.y > height + 100) {
          d.y = -d.len;
          d.x = Math.random() * width;
        }
      }
    }

    function drawVignette() {
      const vignette = ctx.createRadialGradient(width * 0.52, height * 0.44, width * 0.16, width * 0.52, height * 0.44, width * 0.7);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.65, "rgba(0,0,0,0.26)");
      vignette.addColorStop(1, "rgba(0,0,0,0.74)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    }

    function loop() {
      frame += 1;
      background();
      drawGhostCodes();
      drawPetals();
      drawRain();
      drawGlass();
      drawVignette();
      raf = window.requestAnimationFrame(loop);
    }

    function move(event: MouseEvent) {
      const rect = element.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    }

    function leave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    loop();
    window.addEventListener("resize", resize);
    element.addEventListener("mousemove", move);
    element.addEventListener("mouseleave", leave);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      element.removeEventListener("mousemove", move);
      element.removeEventListener("mouseleave", leave);
    };
  }, [canvasRef]);
}

function buildEpisodes(story: Story): EpisodeView[] {
  return story.chapters.length > 0
    ? story.chapters.map((chapter, index) => ({
        id: chapter.id,
        label:
          chapter.chapterLabel === "序" || chapter.chapterLabel === "序章"
            ? "序章"
            : chapter.chapterLabel.startsWith("第")
              ? chapter.chapterLabel
              : `Episode ${String(index + 1).padStart(2, "0")}`,
        title: chapter.title,
        period: chapter.period,
        paragraphs: chapter.paragraphs,
      }))
    : [
        {
          id: "episode-01",
          label: "Episode 01",
          title: story.title,
          period: "",
          paragraphs: story.paragraphs,
        },
      ];
}

export default function MoonlitMemoryRainStory({ story, onBackToList, onSwitchToCinematic }: MoonlitMemoryRainStoryProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useMoonlitBackground(canvasRef);

  const episodes = useMemo(() => buildEpisodes(story), [story]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden="true" />

      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_72%_18%,rgba(225,235,248,0.18),transparent_30%),radial-gradient(circle_at_18%_48%,rgba(197,145,52,0.08),transparent_22%),linear-gradient(to_bottom,rgba(2,6,23,0.08),rgba(2,6,23,0.78))]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 pt-24 pb-16 md:px-10 md:pt-28">
        <header className="flex items-center justify-between border-b border-white/8 pb-6">
          <button
            type="button"
            onClick={onBackToList}
            className="rounded-full border border-[#bd9151]/45 bg-black/10 px-4 py-2 text-xs tracking-[0.22em] text-white/75 transition hover:border-[#d5b273]/80 hover:text-white"
          >
            返回列表
          </button>
          {onSwitchToCinematic && (
            <button
              type="button"
              onClick={onSwitchToCinematic}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.22em] text-white/65 transition hover:border-white/25 hover:text-white"
            >
              电影模式
            </button>
          )}
        </header>

        <section className="relative mt-24 max-w-4xl pt-4 md:mt-32 md:pt-6">
          <div className="h-px w-16 bg-[#c79b55]" />
          <p className="mt-6 font-serif text-[18px] tracking-[0.36em] text-[#bac7d9]/78 md:text-[23px]">
            Moonlit Memory Rain
          </p>
          <h2 className="mt-6 font-serif text-[56px] font-light leading-none tracking-[0.08em] text-white drop-shadow-[0_0_32px_rgba(210,225,245,.2)] md:text-[82px] lg:text-[96px]">
            {story.title}
          </h2>
          <p className="mt-8 max-w-2xl text-[16px] leading-8 tracking-[0.22em] text-white/68 md:text-[18px] md:leading-9">
            月光、雨幕、退潮，与未说出口的记忆。
          </p>
        </section>

        <section className="mt-16 space-y-14 md:mt-20">
          {episodes.map((episode, index) => (
            <article
              key={episode.id}
              id={episode.id}
              className="scroll-mt-24 max-w-4xl"
            >
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.38em] text-white/32">
                  {episode.label || `Episode ${String(index + 1).padStart(2, "0")}`}
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  {episode.title}
                </h3>
                {episode.period ? <p className="mt-2 text-sm text-white/50">{episode.period}</p> : null}
              </div>

              <div className="space-y-6">
                {episode.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${episode.id}-${paragraphIndex}`}
                    className="max-w-4xl text-[16px] leading-8 tracking-[0.08em] text-white/86 md:text-[17px] md:leading-9"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
