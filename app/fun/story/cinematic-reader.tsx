"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Story } from "@/app/lib/story-content";

/* ------------------------------------------------------------------ */
/*  Design system                                                      */
/*  The whole film is a sunrise: each chapter's palette steps toward   */
/*  the light, culminating in a golden dawn over the sea.              */
/* ------------------------------------------------------------------ */

type ChapterDesign = {
  kind: string;
  palette: [string, string, string];
  accent: string; // hex
  hero: [string, string]; // accent glow origin [left, top]
};

const CHAPTER_DESIGNS: ChapterDesign[] = [
  { kind: "prologue", palette: ["#070d18", "#0c1626", "#02040a"], accent: "#bcd4f0", hero: ["50%", "40%"] },
  { kind: "osmanthus", palette: ["#080c1a", "#101a30", "#03060e"], accent: "#e8c870", hero: ["34%", "46%"] },
  { kind: "moonlit", palette: ["#0a0f24", "#141a38", "#04060f"], accent: "#aab6e8", hero: ["76%", "22%"] },
  { kind: "diary", palette: ["#08161a", "#0e262a", "#03080a"], accent: "#7fc3b2", hero: ["60%", "44%"] },
  { kind: "hostage", palette: ["#120712", "#2a0e1c", "#040208"], accent: "#b5687f", hero: ["50%", "12%"] },
  { kind: "track", palette: ["#0b0612", "#220a14", "#02040a"], accent: "#e0a45c", hero: ["50%", "16%"] },
  { kind: "rooftop", palette: ["#060b18", "#0e1a30", "#020610"], accent: "#9fc3ff", hero: ["68%", "28%"] },
  { kind: "predawn", palette: ["#0a0c14", "#161823", "#040507"], accent: "#c9a96a", hero: ["48%", "60%"] },
  { kind: "sea", palette: ["#16263c", "#26405a", "#040a12"], accent: "#ffcf8a", hero: ["26%", "34%"] },
  { kind: "hearth", palette: ["#100a06", "#241608", "#050302"], accent: "#e6a85c", hero: ["50%", "60%"] },
  { kind: "mountain", palette: ["#0a1426", "#163355", "#03070e"], accent: "#cfa84a", hero: ["50%", "30%"] },
  { kind: "dawn", palette: ["#1a1208", "#3a240e", "#080402"], accent: "#ffc066", hero: ["50%", "64%"] },
  { kind: "reconciliation", palette: ["#0a1020", "#16243e", "#03060e"], accent: "#cfd8e8", hero: ["30%", "22%"] },
  { kind: "library", palette: ["#0c0a08", "#1f1810", "#030201"], accent: "#e8cf8a", hero: ["60%", "42%"] },
  { kind: "finale", palette: ["#2a1a0c", "#5a3a18", "#0a0603"], accent: "#ffd98a", hero: ["50%", "56%"] },
];

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ------------------------------------------------------------------ */
/*  Subtitle cue builder                                               */
/* ------------------------------------------------------------------ */

function makeSubtitleCues(paragraphs: string[]) {
  const cues: string[] = [];
  const LIMIT = 46;
  for (const paragraph of paragraphs) {
    const segments = paragraph
      .replaceAll(/([。！？])/g, "$1|")
      .replaceAll(/([，、；])/g, "$1|")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    let buffer = "";
    for (const seg of segments) {
      if ((buffer + seg).length <= LIMIT) {
        buffer += seg;
      } else {
        if (buffer) cues.push(buffer);
        if (seg.length > LIMIT) {
          for (let i = 0; i < seg.length; i += LIMIT) cues.push(seg.slice(i, i + LIMIT));
          buffer = "";
        } else {
          buffer = seg;
        }
      }
    }
    if (buffer) cues.push(buffer);
  }
  return cues;
}

function cueDuration(text: string) {
  return Math.min(8200, Math.max(3600, 2100 + text.length * 110));
}

type Episode = {
  design: ChapterDesign;
  card: string;
  chapterTitle: string;
  cues: string[];
};

function buildEpisodes(story: Story): Episode[] {
  return story.chapters.map((chapter, index) => {
    const design = CHAPTER_DESIGNS[index] ?? CHAPTER_DESIGNS[CHAPTER_DESIGNS.length - 1];
    const isLast = index === story.chapters.length - 1;
    const card = index === 0 ? "PROLOGUE" : isLast ? "EPILOGUE" : `EPISODE ${String(index).padStart(2, "0")}`;
    return {
      design,
      card,
      chapterTitle: chapter.title || chapter.chapterLabel,
      cues: makeSubtitleCues(chapter.paragraphs),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Atmosphere primitives                                              */
/* ------------------------------------------------------------------ */

function AtmosphereBase({ design, children }: { design: ChapterDesign; children: ReactNode }) {
  const [c0, c1, c2] = design.palette;
  const [hl, ht] = design.hero;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(160deg, ${c0} 0%, ${c1} 55%, ${c2} 100%)` }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at ${hl} ${ht}, ${rgba(design.accent, 0.14)}, transparent 46%)`, mixBlendMode: "screen" }} />
      {children}
      <MistDrift tone={rgba(design.accent, 0.1)} />
    </div>
  );
}

function MistDrift({ tone = "rgba(180,200,230,0.1)" }: { tone?: string }) {
  return (
    <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute h-[38vh] w-[150%]"
          style={{ left: "-25%", top: `${14 + i * 19}%`, background: `linear-gradient(90deg, transparent, ${tone}, transparent)`, filter: "blur(46px)" }}
          animate={{ x: ["-7%", "7%", "-7%"], opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 28 + i * 7, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function BokehField({ tone = "#ffe6a8", count = 16 }: { tone?: string; count?: number }) {
  return (
    <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: count }).map((_, i) => {
        const size = 10 + ((i * 37) % 46);
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: size, height: size, left: `${(i * 53.3) % 100}%`, top: `${(i * 71.7) % 100}%`, background: `radial-gradient(circle, ${rgba(tone, 0.5)} 0%, transparent 70%)`, filter: "blur(3px)" }}
            animate={{ y: [0, -20 - (i % 5) * 5, 0], opacity: [0.04, 0.26 - (i % 3) * 0.05, 0.04] }}
            transition={{ duration: 10 + (i % 6) * 2, repeat: Infinity, delay: (i % 7) * 0.6, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}

function RainVeil({ tone, density = 56 }: { tone: string; density?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: density }).map((_, i) => {
        const near = i % 4 === 0;
        return (
          <motion.span
            key={i}
            className="absolute block"
            style={{ left: `${(i * 53.7) % 100}%`, top: "-18%", width: near ? 1.3 : 0.7, height: near ? 150 : 84, background: `linear-gradient(to bottom, transparent, ${tone}, transparent)`, opacity: near ? 0.7 : 0.3 }}
            animate={{ y: [0, 940], x: [0, -34] }}
            transition={{ duration: near ? 0.72 + (i % 5) * 0.07 : 1.12 + (i % 7) * 0.09, repeat: Infinity, delay: (i % 30) * 0.05, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}

function PetalsDrift({ tone, count = 18 }: { tone: string; count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: count }).map((_, i) => {
        const s = 4 + (i % 4) * 2;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ left: `${(i * 61.3) % 100}%`, top: "-8%", width: s, height: s * 0.5, background: tone, boxShadow: `0 0 12px ${tone}` }}
            animate={{ y: [0, 900], x: [0, i % 2 ? 70 : -70], rotate: [0, 220], opacity: [0, 0.9, 0] }}
            transition={{ duration: 10 + (i % 5), repeat: Infinity, delay: (i % 9) * 0.5, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}

function OrbGlow({ color, left, top, size = 120 }: { color: string; left: string; top: string; size?: number }) {
  return (
    <div className="absolute" style={{ left, top, width: size, height: size, transform: "translate(-50%, -50%)" }}>
      <div className="absolute rounded-full" style={{ inset: "-220%", background: `radial-gradient(circle, ${rgba(color, 0.22)} 0%, transparent 55%)`, filter: "blur(8px)" }} />
      <motion.div
        className="absolute rounded-full"
        style={{ inset: "-80%", background: `radial-gradient(circle, ${rgba(color, 0.35)} 0%, transparent 60%)`, filter: "blur(10px)" }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 42% 38%, rgba(255,255,255,0.6) 0%, ${color} 42%, ${rgba(color, 0.2)} 72%, transparent 80%)` }} />
    </div>
  );
}

function LightShaft({ tone, left = "50%", top = "0%", rotate = 0, width = 420 }: { tone: string; left?: string; top?: string; rotate?: number; width?: number }) {
  return (
    <div className="absolute" style={{ left, top, transform: `translateX(-50%) rotate(${rotate}deg)`, transformOrigin: "top center", mixBlendMode: "screen" }}>
      <motion.div
        className="absolute"
        style={{ left: -width / 2, top: 0, width, height: "120vh", background: `linear-gradient(to bottom, ${tone}, transparent 75%)`, WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 75%)", maskImage: "linear-gradient(to bottom, black 0%, transparent 75%)", filter: "blur(16px)" }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function SeaHorizon({ tone, accent, orbLeft = "30%" }: { tone: string; accent: string; orbLeft?: string }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute" style={{ left: 0, right: 0, top: "47%", height: "13%", background: `linear-gradient(to bottom, transparent, ${rgba(accent, 0.2)}, transparent)`, filter: "blur(16px)", mixBlendMode: "screen" }} />
      <div className="absolute" style={{ left: 0, right: 0, top: "51%", height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.9, filter: "blur(0.8px)" }} />
      <div className="absolute" style={{ left: 0, right: 0, top: "52%", bottom: 0, background: `linear-gradient(to bottom, ${tone}, #000 94%)` }} />
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: "14%", right: "14%", top: `${53 + i * 2.4}%`, height: 1.5, background: accent, opacity: 0.3, filter: "blur(0.5px)", transformOrigin: "center" }}
          animate={{ opacity: [0.06, 0.4 - i * 0.014, 0.06], scaleX: [0.85, 1.08, 0.85] }}
          transition={{ duration: 4 + i * 0.25, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute" style={{ left: orbLeft, top: "52%", bottom: 0, width: "22%", transform: "translateX(-50%)", background: `linear-gradient(to bottom, ${accent}, transparent)`, opacity: 0.3, filter: "blur(12px)" }} />
    </div>
  );
}

function Starfield({ tone = "rgba(220,230,255,0.9)", count = 70, constellation = false }: { tone?: string; count?: number; constellation?: boolean }) {
  const stars = Array.from({ length: count }).map((_, i) => ({
    x: (i * 67.7) % 100,
    y: (i * 41.3) % 62,
    r: (i % 9 === 0 ? 1.6 : 0.7) + (i % 3) * 0.2,
    tw: 0.6 + (i % 5) * 0.2,
    ph: (i % 7) * 0.5,
  }));
  const linkSet = constellation ? [3, 11, 18, 26, 33, 41] : [];
  return (
    <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
      {constellation && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 62" preserveAspectRatio="none" style={{ opacity: 0.42 }}>
          <polyline points={linkSet.map((idx) => `${stars[idx].x},${stars[idx].y}`).join(" ")} fill="none" stroke={tone} strokeWidth="0.22" />
        </svg>
      )}
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, background: tone, boxShadow: i % 9 === 0 ? `0 0 6px ${tone}` : "none" }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: s.tw * 3, repeat: Infinity, delay: s.ph, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Streaks({ tone = "rgba(255,220,170,0.9)", count = 14 }: { tone?: string; count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: count }).map((_, i) => {
        const diag = i % 3 === 0;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ top: `${22 + ((i * 17) % 56)}%`, left: "-25%", height: 2, width: 240 + (i % 5) * 90, background: `linear-gradient(90deg, transparent, ${tone}, transparent)`, boxShadow: `0 0 10px ${tone}`, filter: "blur(0.8px)", rotate: diag ? "-3deg" : "0deg" }}
            animate={{ x: [0, 1500], opacity: [0, 0.95, 0] }}
            transition={{ duration: 1.3 + (i % 5) * 0.14, repeat: Infinity, delay: (i % 7) * 0.28, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

function Mountains({ tone = "#02040a", tone2 }: { tone?: string; tone2?: string }) {
  return (
    <svg className="absolute bottom-0 left-0 w-full" style={{ height: "46vh" }} viewBox="0 0 1440 400" preserveAspectRatio="none">
      {tone2 && <path d="M0,400 L0,210 L180,120 L340,200 L520,90 L700,200 L900,110 L1100,210 L1280,140 L1440,220 L1440,400 Z" fill={tone2} opacity="0.85" />}
      <path d="M0,400 L0,280 L160,170 L300,260 L460,150 L640,250 L820,160 L1020,260 L1200,180 L1440,270 L1440,400 Z" fill={tone} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Symbolic motifs — each chapter has its own signature silhouette    */
/* ------------------------------------------------------------------ */

function FractureCrack({ tone = "#cfe0f5" }: { tone?: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 0.55, mixBlendMode: "screen" }}>
      <motion.path d="M22 6 L31 26 L25 42 L37 58 L29 78 L41 96" stroke={rgba(tone, 0.55)} strokeWidth="0.28" fill="none" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 3.4, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }} />
      <path d="M31 26 L42 23 M25 42 L15 48 M37 58 L48 56 M29 78 L20 82" stroke={rgba(tone, 0.32)} strokeWidth="0.18" fill="none" />
    </svg>
  );
}

function Umbrella({ left = "42%", top = "46%", scale = 1 }: { left?: string; top?: string; scale?: number }) {
  return (
    <div className="absolute" style={{ left, top, width: 190 * scale, height: 210 * scale, transform: "translate(-50%,-50%)" }}>
      <svg viewBox="0 0 180 200" className="h-full w-full" style={{ filter: `drop-shadow(0 10px 28px rgba(0,0,0,0.65)) drop-shadow(0 0 18px ${rgba("#e8c870", 0.22)})` }}>
        <path d="M8 92 Q90 -14 172 92 Q172 98 161 94 Q128 60 90 56 Q52 60 19 94 Q8 98 8 92 Z" fill="rgba(6,10,20,0.95)" />
        <path d="M8 92 Q45 78 90 76 Q135 78 172 92" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
        <line x1="90" y1="92" x2="90" y2="182" stroke="rgba(6,10,20,0.97)" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M90 182 Q90 196 104 196" fill="none" stroke="rgba(6,10,20,0.97)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function RingedMoon({ left, top, color = "#cdd8f5", ring = "#9a2a36", size = 130 }: { left: string; top: string; color?: string; ring?: string; size?: number }) {
  return (
    <div className="absolute" style={{ left, top, width: size, height: size, transform: "translate(-50%,-50%)" }}>
      <motion.div className="absolute rounded-full" style={{ inset: "-92%", border: `1.5px solid ${rgba(ring, 0.55)}`, boxShadow: `0 0 70px ${rgba(ring, 0.4)}, inset 0 0 40px ${rgba(ring, 0.25)}` }} animate={{ opacity: [0.45, 0.85, 0.45], scale: [1, 1.03, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <div className="absolute rounded-full" style={{ inset: "-200%", background: `radial-gradient(circle, ${rgba(color, 0.18)}, transparent 55%)`, filter: "blur(6px)" }} />
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 40% 38%, rgba(255,255,255,0.55), ${color} 44%, ${rgba(color, 0.2)} 76%, transparent 84%)` }} />
    </div>
  );
}

function ThreadWeb({ tone = "#7fc3b2" }: { tone?: string }) {
  const paths = ["M6 26 Q44 8 76 40 T150 28", "M16 58 Q58 28 100 70 T158 48", "M2 92 Q48 60 90 100 T150 78", "M28 16 Q72 82 128 24", "M8 116 Q60 52 112 122", "M40 14 Q30 80 130 96"];
  return (
    <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 130" preserveAspectRatio="none">
        {paths.map((d, i) => (
          <motion.path key={i} d={d} fill="none" stroke={rgba(tone, 0.5)} strokeWidth="0.4" strokeDasharray="2 3" animate={{ opacity: [0.18, 0.6, 0.18] }} transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.4 }} />
        ))}
      </svg>
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.span key={i} className="absolute rounded-full" style={{ left: `${16 + i * 12}%`, top: `${22 + (i % 4) * 18}%`, width: 3, height: 3, background: tone, boxShadow: `0 0 9px ${tone}` }} animate={{ opacity: [0.1, 0.75, 0.1] }} transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }} />
      ))}
    </div>
  );
}

function CageBars({ tone = "#b5687f" }: { tone?: string }) {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="absolute" style={{ left: `${6 + i * 11}%`, top: "-5%", bottom: "-5%", width: 6, background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.88), transparent)", boxShadow: "2px 0 10px rgba(0,0,0,0.4)" }} />
      ))}
      <motion.div className="absolute inset-y-0 w-[45%]" style={{ background: `linear-gradient(90deg, transparent, ${rgba(tone, 0.12)}, transparent)`, filter: "blur(30px)" }} animate={{ x: ["-60%", "160%"] }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }} />
    </div>
  );
}

function CityGrid({ tone = "#9fc3ff" }: { tone?: string }) {
  return (
    <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
      <div className="absolute" style={{ left: 0, right: 0, top: "57%", height: 1, background: `linear-gradient(90deg, transparent, ${rgba(tone, 0.34)}, transparent)` }} />
      {Array.from({ length: 90 }).map((_, i) => (
        <motion.span key={i} className="absolute rounded-[1px]" style={{ left: `${(i * 13) % 100}%`, top: `${59 + ((i * 7) % 32)}%`, width: 2, height: 2, background: tone, opacity: 0.5 }} animate={{ opacity: [0.08, 0.7, 0.08] }} transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: (i % 9) * 0.3 }} />
      ))}
    </div>
  );
}

function LighthouseBeam({ tone = "#c9a96a", left = "50%", base = "76%" }: { tone?: string; left?: string; base?: string }) {
  return (
    <div className="absolute" style={{ left, top: base, transform: "translate(-50%,-100%)" }}>
      <motion.div className="absolute origin-bottom" style={{ left: 0, top: "-78vh", width: "70vw", height: "78vh", marginLeft: "-35vw", background: `linear-gradient(to top, ${rgba(tone, 0.3)}, transparent 72%)`, clipPath: "polygon(47% 100%, 53% 100%, 100% 0, 0 0)", filter: "blur(10px)", transformOrigin: "bottom center" }} animate={{ rotate: [-20, 20, -20], opacity: [0.12, 0.38, 0.12] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }} />
      <div className="absolute" style={{ left: "-7px", top: "-6px", width: 14, height: 46, background: "rgba(0,0,0,0.78)", clipPath: "polygon(22% 0, 78% 0, 100% 100%, 0 100%)" }} />
      <motion.div className="absolute rounded-full" style={{ left: "-4px", top: "-4px", width: 8, height: 8, background: tone, boxShadow: `0 0 16px ${tone}` }} animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
    </div>
  );
}

function KettleScene({ tone = "#f0b870" }: { tone?: string }) {
  return (
    <div className="absolute inset-0">
      <motion.div className="absolute" style={{ left: "44%", top: "40%", width: "13%", height: "28%", background: `linear-gradient(to bottom, ${rgba(tone, 0.55)}, ${rgba(tone, 0.12)})`, boxShadow: `0 0 90px ${rgba(tone, 0.42)}`, border: "2px solid rgba(0,0,0,0.45)" }} animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 5, repeat: Infinity }} />
      <svg className="absolute" style={{ left: "50%", bottom: "30%", width: 96, height: 74, transform: "translateX(-50%)" }} viewBox="0 0 96 74">
        <rect x="24" y="22" width="46" height="42" rx="7" fill="rgba(0,0,0,0.86)" />
        <path d="M70 30 Q86 34 80 50" fill="none" stroke="rgba(0,0,0,0.86)" strokeWidth="5" strokeLinecap="round" />
        <path d="M24 30 L10 24 L15 33 Z" fill="rgba(0,0,0,0.86)" />
      </svg>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full" style={{ left: "50%", bottom: "40%", width: 6, height: 86, marginLeft: (i - 2.5) * 9, background: `linear-gradient(to top, ${rgba(tone, 0.45)}, transparent)`, filter: "blur(4px)" }} animate={{ y: [0, -90], opacity: [0, 0.5, 0], x: [0, i % 2 ? 12 : -12] }} transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.5 }} />
      ))}
    </div>
  );
}

function RidgelineFigure({ tone = "#02060e", accent = "#ffe0a0" }: { tone?: string; accent?: string }) {
  return (
    <div className="absolute inset-0">
      <svg className="absolute bottom-0 left-0 w-full" style={{ height: "46vh" }} viewBox="0 0 1440 400" preserveAspectRatio="none">
        <path d="M0,400 L0,300 L300,150 L520,270 L760,96 L980,250 L1200,160 L1440,290 L1440,400 Z" fill={tone} />
      </svg>
      <div className="absolute" style={{ left: "52.6%", bottom: "31.5%", width: 14, height: 38, background: "rgba(0,0,0,0.88)", borderRadius: "42% 42% 6% 6%", filter: "blur(0.5px)", boxShadow: `0 -4px 22px ${rgba(accent, 0.5)}` }} />
    </div>
  );
}

function House({ left = "50%", top = "64%", accent = "#ffc066" }: { left?: string; top?: string; accent?: string }) {
  return (
    <div className="absolute" style={{ left, top, width: 76, height: 68, transform: "translate(-50%,-100%)" }}>
      <svg viewBox="0 0 76 68" className="h-full w-full" style={{ filter: `drop-shadow(0 0 18px ${rgba(accent, 0.55)})` }}>
        <path d="M6 36 L38 8 L70 36 L62 36 L62 66 L14 66 L14 36 Z" fill="rgba(6,4,1,0.96)" />
        <rect x="30" y="42" width="16" height="18" fill={rgba(accent, 0.85)} />
      </svg>
    </div>
  );
}

function CrackBeam({ tone = "#dbe3f2" }: { tone?: string }) {
  return (
    <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M50 0 L45 22 L55 40 L43 60 L54 80 L47 100 L47 100" stroke="rgba(0,0,0,0.9)" strokeWidth="1.4" fill="none" />
        <path d="M45 22 L37 18 M55 40 L64 36 L64 36 M43 60 L34 64 M54 80 L63 76" stroke="rgba(0,0,0,0.7)" strokeWidth="0.7" fill="none" />
      </svg>
      <motion.div className="absolute" style={{ left: "47%", top: 0, width: "8%", height: "100%", background: `linear-gradient(to bottom, ${rgba(tone, 0.55)}, ${rgba(tone, 0.15)}, transparent 82%)`, filter: "blur(7px)" }} animate={{ opacity: [0.35, 0.95, 0.35] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute" style={{ left: "44%", top: 0, width: "14%", height: "100%", background: `linear-gradient(to bottom, ${rgba(tone, 0.2)}, transparent 60%)`, filter: "blur(16px)" }} animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 6, repeat: Infinity }} />
    </div>
  );
}

function TwoFigures({ accent = "#e8cf8a" }: { accent?: string }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute" style={{ left: "30%", bottom: "20%", width: 130, height: 170, transform: "translateX(-50%)", background: `radial-gradient(circle, ${rgba(accent, 0.24)}, transparent 60%)`, filter: "blur(8px)", mixBlendMode: "screen" }} />
      <div className="absolute" style={{ left: "63%", bottom: "20%", width: 160, height: 210, transform: "translateX(-50%)", background: `radial-gradient(circle, ${rgba(accent, 0.28)}, transparent 60%)`, filter: "blur(8px)", mixBlendMode: "screen" }} />
      <div className="absolute" style={{ left: "30%", bottom: "28%", width: 20, height: 56, background: "rgba(0,0,0,0.84)", borderRadius: "42% 42% 6% 6%", filter: "blur(0.5px)", boxShadow: `0 -3px 16px ${rgba(accent, 0.5)}` }} />
      <div className="absolute" style={{ left: "63%", bottom: "28%", width: 28, height: 82, background: "rgba(0,0,0,0.86)", borderRadius: "42% 42% 6% 6%", filter: "blur(0.5px)", boxShadow: `0 -3px 18px ${rgba(accent, 0.55)}` }} />
    </div>
  );
}

function Sparkle({ left, top, color = "#9fdcff", size = 38 }: { left: string; top: string; color?: string; size?: number }) {
  return (
    <motion.div className="absolute" style={{ left, top, width: size, height: size, transform: "translate(-50%,-50%)" }} animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <svg viewBox="0 0 40 40" className="h-full w-full" style={{ filter: `drop-shadow(0 0 10px ${color})` }}>
        <path d="M20 0 L23 17 L40 20 L23 23 L20 40 L17 23 L0 20 L17 17 Z" fill={color} />
      </svg>
    </motion.div>
  );
}

function SceneFor({ design }: { design: ChapterDesign }) {
  switch (design.kind) {
    case "prologue":
      return (
        <AtmosphereBase design={design}>
          <LightShaft tone={rgba("#cfe0f5", 0.3)} left="50%" top="-8%" rotate={0} width={460} />
          <RainVeil tone="rgba(195,215,245,0.55)" density={70} />
          <FractureCrack tone="#cfe0f5" />
          <BokehField tone="#cfe0f5" count={9} />
        </AtmosphereBase>
      );
    case "osmanthus":
      return (
        <AtmosphereBase design={design}>
          <RainVeil tone="rgba(205,218,245,0.5)" density={62} />
          <Umbrella left="42%" top="46%" scale={1.15} />
          <PetalsDrift tone="#e8c870" count={24} />
          <BokehField tone="#e8c870" count={8} />
        </AtmosphereBase>
      );
    case "moonlit":
      return (
        <AtmosphereBase design={design}>
          <RingedMoon left="76%" top="22%" color="#cdd8f5" ring="#9a2a36" size={132} />
          <Starfield tone="rgba(210,222,250,0.9)" count={56} />
          <RainVeil tone="rgba(170,190,235,0.26)" density={26} />
          <motion.div className="absolute" style={{ left: "14%", top: "34%", width: "44%", height: 2, rotate: "-11deg", background: "linear-gradient(90deg, transparent, #8a2a36, transparent)", filter: "blur(1px)" }} animate={{ opacity: [0.18, 0.55, 0.18] }} transition={{ duration: 6, repeat: Infinity }} />
        </AtmosphereBase>
      );
    case "diary":
      return (
        <AtmosphereBase design={design}>
          <ThreadWeb tone="#7fc3b2" />
          <BokehField tone="#7fc3b2" count={12} />
        </AtmosphereBase>
      );
    case "hostage":
      return (
        <AtmosphereBase design={design}>
          <LightShaft tone={rgba("#d9a4ba", 0.42)} left="50%" top="-8%" rotate={0} width={300} />
          <CageBars tone="#b5687f" />
          <div className="absolute" style={{ left: 0, top: 0, bottom: 0, width: "22%", background: "linear-gradient(to right, rgba(0,0,0,0.72), transparent)" }} />
          <div className="absolute" style={{ right: 0, top: 0, bottom: 0, width: "22%", background: "linear-gradient(to left, rgba(0,0,0,0.72), transparent)" }} />
        </AtmosphereBase>
      );
    case "track":
      return (
        <AtmosphereBase design={design}>
          <OrbGlow color="#ffd9a0" left="50%" top="10%" size={184} />
          <OrbGlow color="#ffcf8a" left="74%" top="18%" size={64} />
          <LightShaft tone={rgba("#ffd9a0", 0.34)} left="50%" top="8%" rotate={0} width={580} />
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={`h${i}`} className="absolute" style={{ left: "50%", bottom: `${8 + i * 1.7}%`, width: `${6 + i * 12}%`, height: 1, transform: "translateX(-50%)", background: rgba("#e0a45c", 0.16), opacity: 0.75 }} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`v${i}`} className="absolute" style={{ left: `${34 + i * 6}%`, bottom: "6%", width: 1, height: "44%", transform: `rotate(${(i - 3) * 7}deg)`, transformOrigin: "bottom center", background: rgba("#e0a45c", 0.12) }} />
          ))}
          <Streaks tone="rgba(255,222,176,0.95)" count={16} />
        </AtmosphereBase>
      );
    case "rooftop":
      return (
        <AtmosphereBase design={design}>
          <RainVeil tone="rgba(155,185,228,0.22)" density={26} />
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} className="absolute h-px" style={{ left: "-10%", top: `${24 + i * 7}%`, width: "120%", background: `linear-gradient(90deg, transparent, ${rgba("#9fc3ff", 0.4)}, transparent)` }} animate={{ x: [-40, 40], opacity: [0.1, 0.35, 0.1] }} transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }} />
          ))}
          <CityGrid tone="#9fc3ff" />
          <div className="absolute" style={{ left: "46%", bottom: "14%", width: "9%", height: "34%", background: "rgba(0,0,0,0.62)", filter: "blur(1px)", borderRadius: "40% 40% 8% 8%" }} />
        </AtmosphereBase>
      );
    case "predawn":
      return (
        <AtmosphereBase design={design}>
          <Starfield tone="rgba(205,182,140,0.8)" count={46} />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute" style={{ left: "50%", bottom: `${6 + i * 2.4}%`, width: `${30 + i * 9}%`, height: 1, transform: "translateX(-50%)", background: rgba("#c9a96a", 0.1), opacity: 0.6 }} />
          ))}
          <LighthouseBeam tone="#c9a96a" left="50%" base="76%" />
        </AtmosphereBase>
      );
    case "sea":
      return (
        <AtmosphereBase design={design}>
          <div className="absolute" style={{ left: "30%", top: "44%", width: "72vw", height: "72vw", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(255,178,116,0.3), transparent 55%)", filter: "blur(8px)", mixBlendMode: "screen" }} />
          <div className="absolute" style={{ left: 0, right: 0, top: "38%", height: "26%", background: "linear-gradient(to bottom, transparent, rgba(255,158,98,0.2), rgba(255,128,78,0.1), transparent)", filter: "blur(18px)", mixBlendMode: "screen" }} />
          <SeaHorizon tone="#0c2236" accent="#ffcf8a" orbLeft="30%" />
          <Sparkle left="42%" top="49%" color="#bfe8ff" size={42} />
          <PetalsDrift tone="#9fdcff" count={7} />
          <BokehField tone="#ffcf8a" count={10} />
        </AtmosphereBase>
      );
    case "hearth":
      return (
        <AtmosphereBase design={design}>
          <KettleScene tone="#f0b870" />
          <BokehField tone="#e6a85c" count={16} />
        </AtmosphereBase>
      );
    case "mountain":
      return (
        <AtmosphereBase design={design}>
          <div className="absolute" style={{ left: "53%", top: "52%", width: "66vw", height: "66vw", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(255,224,160,0.36), transparent 55%)", filter: "blur(8px)", mixBlendMode: "screen" }} />
          <LightShaft tone={rgba("#ffe0a0", 0.58)} left="53%" top="48%" rotate={0} width={520} />
          <RidgelineFigure tone="#02060e" accent="#ffe0a0" />
          <Streaks tone="rgba(255,230,180,0.55)" count={7} />
        </AtmosphereBase>
      );
    case "dawn":
      return (
        <AtmosphereBase design={design}>
          <Mountains tone="#160a02" tone2="#2a1404" />
          <House left="50%" top="64%" accent="#ffc066" />
          <OrbGlow color="#ffc066" left="50%" top="66%" size={150} />
          <LightShaft tone={rgba("#ffc066", 0.5)} left="50%" top="62%" rotate={-6} width={560} />
          <BokehField tone="#ffc066" count={18} />
        </AtmosphereBase>
      );
    case "reconciliation":
      return (
        <AtmosphereBase design={design}>
          <Starfield tone="rgba(220,230,255,0.9)" count={64} />
          <CrackBeam tone="#dbe3f2" />
          <BokehField tone="#cfd8e8" count={9} />
        </AtmosphereBase>
      );
    case "library":
      return (
        <AtmosphereBase design={design}>
          <Starfield tone="rgba(232,207,138,0.9)" count={58} constellation />
          <TwoFigures />
          <BokehField tone="#e8cf8a" count={12} />
        </AtmosphereBase>
      );
    case "finale":
    default:
      return (
        <AtmosphereBase design={design}>
          <div className="absolute" style={{ left: "50%", top: "56%", width: "90vw", height: "90vw", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(255,210,130,0.3), transparent 55%)", filter: "blur(10px)", mixBlendMode: "screen" }} />
          <SeaHorizon tone="#160e04" accent="#ffd98a" orbLeft="50%" />
          <Mountains tone="#241404" tone2="#3a2208" />
          <OrbGlow color="#ffd98a" left="50%" top="55%" size={196} />
          <LightShaft tone={rgba("#ffd98a", 0.6)} left="50%" top="50%" rotate={0} width={680} />
          <LightShaft tone={rgba("#fff0c0", 0.34)} left="40%" top="48%" rotate={-14} width={380} />
          <PetalsDrift tone="#ffe28a" count={26} />
          <BokehField tone="#ffe6a8" count={26} />
        </AtmosphereBase>
      );
  }
}

function SceneStage({ design, phase }: { design: ChapterDesign; phase: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "scene" ? 1 : 0.45, scale: phase === "scene" ? 1.05 : 1.0 }}
        transition={{ opacity: { duration: 1.2 }, scale: { duration: 36, ease: "linear" } }}
      >
        <SceneFor design={design} />
      </motion.div>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 38%, transparent 0%, rgba(0,0,0,0.16) 50%, rgba(0,0,0,0.66) 100%)" }} />
      <div className="absolute inset-x-0 bottom-0" style={{ height: "33vh", background: "linear-gradient(to top, rgba(0,0,0,0.86), transparent)" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Film scaffolding                                                   */
/* ------------------------------------------------------------------ */

function FilmNoise() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 mix-blend-screen"
      style={{ opacity: 0.014, backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "4px 4px" }}
    />
  );
}

function Letterbox() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <div className="absolute left-0 right-0 top-0 z-40 bg-black" style={{ height: "72px" }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black" style={{ height: "8vh" }} />
    </div>
  );
}

function BlackTitle({ card, title }: { card: string; title: string }) {
  return (
    <motion.div className="absolute inset-0 z-20 flex items-center justify-center bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.75 }}>
      <motion.div className="text-center" initial={{ opacity: 0, y: 18, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(6px)" }} transition={{ duration: 1.1 }}>
        <div className="mb-5 font-serif text-sm tracking-[0.6em] text-white/55 md:text-base">{card}</div>
        <div className="font-serif text-5xl font-semibold tracking-[0.18em] text-white md:text-8xl">{title}</div>
      </motion.div>
    </motion.div>
  );
}

function Subtitle({ text, playing }: { text: string; playing: boolean }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        className="absolute bottom-[13vh] left-1/2 z-20 w-[min(980px,86vw)] -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
        animate={{ opacity: playing ? 1 : 0.7, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -14, filter: "blur(5px)" }}
        transition={{ duration: 0.9 }}
      >
        <p className="font-serif text-2xl leading-[1.85] tracking-[0.12em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)] md:text-[2rem]">{text}</p>
      </motion.div>
    </AnimatePresence>
  );
}

function Controls({
  isPaused,
  setIsPaused,
  prevEpisode,
  nextEpisode,
  canPrev,
  isEnd,
  playMode,
  setPlayMode,
}: {
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  prevEpisode: () => void;
  nextEpisode: () => void;
  canPrev: boolean;
  isEnd: boolean;
  playMode: "auto" | "manual";
  setPlayMode: React.Dispatch<React.SetStateAction<"auto" | "manual">>;
}) {
  return (
    <div data-controls className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-3 text-sm text-white/80 shadow-2xl backdrop-blur-xl">
      <button onClick={prevEpisode} disabled={!canPrev} className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20 disabled:opacity-30">Previous</button>
      {playMode === "auto" && (
        <button onClick={() => setIsPaused((p) => !p)} className="rounded-full bg-white px-5 py-2 font-medium text-black transition hover:scale-[1.03]">{isPaused ? "Play" : "Pause"}</button>
      )}
      <button onClick={nextEpisode} className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20">{isEnd ? "Replay" : "Next Episode"}</button>
      <div className="mx-1 h-5 w-px bg-white/15" />
      <button onClick={() => setPlayMode((m) => (m === "auto" ? "manual" : "auto"))} className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20" title={playMode === "auto" ? "切换到手动播放" : "切换到自动播放"}>{playMode === "auto" ? "Auto" : "Manual"}</button>
    </div>
  );
}

function ProgressBar({ current, total, card, cueIndex, cueTotal }: { current: number; total: number; card: string; cueIndex: number; cueTotal: number }) {
  const episodePct = total <= 1 ? 0 : current / (total - 1);
  const cuePct = cueTotal <= 1 ? 0 : cueIndex / Math.max(1, cueTotal - 1);
  return (
    <div className="fixed left-1/2 top-[88px] z-50 w-[min(820px,82vw)] -translate-x-1/2">
      <div className="mb-2 flex justify-between font-serif text-[10px] uppercase tracking-[0.35em] text-white/45">
        <span>{card}</span>
        <span>{String(cueIndex + 1).padStart(2, "0")} / {String(cueTotal).padStart(2, "0")}</span>
      </div>
      <div className="h-px overflow-hidden bg-white/15">
        <motion.div className="h-full bg-white/70" animate={{ width: `${(episodePct * 0.25 + cuePct * 0.75) * 100}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
}

function EndScene() {
  return (
    <div className="absolute inset-0 bg-black">
      <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(255,210,140,0.18), transparent 60%)" }} />
      <div className="absolute inset-0" style={{ opacity: 0.07, backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "4px 4px" }} />
    </div>
  );
}

function EndCard({ onReplay }: { onReplay: () => void }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-center">
      <EndScene />
      <motion.div className="relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.3 }}>
        <div className="font-serif text-5xl tracking-[0.18em] text-white md:text-8xl">END OF STORY</div>
        <p className="mt-8 font-serif text-xl tracking-[0.18em] text-white/70 md:text-2xl">雨的尽头，是海。</p>
        <button onClick={onReplay} className="mt-12 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm tracking-[0.2em] text-white/80 backdrop-blur transition hover:bg-white hover:text-black">REPLAY</button>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Reader                                                             */
/* ------------------------------------------------------------------ */

type CinematicReaderProps = {
  story: Story;
  onExit: () => void;
};

export default function CinematicReader({ story, onExit }: CinematicReaderProps) {
  const episodes = useMemo(() => buildEpisodes(story), [story]);

  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [cueIndex, setCueIndex] = useState(0);
  const [phase, setPhase] = useState<"title" | "black" | "scene">("title");
  const [isPaused, setIsPaused] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [playMode, setPlayMode] = useState<"auto" | "manual">("auto");

  const current = episodes[episodeIndex];
  const cueTotal = current?.cues.length || 1;
  const currentCue = current?.cues[Math.min(cueIndex, cueTotal - 1)] || "";

  function goEpisode(target: number) {
    const nextTarget = Math.max(0, Math.min(episodes.length - 1, target));
    setShowEnd(false);
    setEpisodeIndex(nextTarget);
    setCueIndex(0);
    setPhase("title");
  }

  function nextEpisode() {
    if (showEnd) {
      goEpisode(0);
      return;
    }
    if (episodeIndex >= episodes.length - 1) {
      setShowEnd(true);
      return;
    }
    goEpisode(episodeIndex + 1);
  }

  function prevEpisode() {
    goEpisode(episodeIndex - 1);
  }

  function advance() {
    if (showEnd || !current) return;
    if (phase === "title") {
      setPhase("black");
    } else if (phase === "black") {
      setPhase("scene");
    } else if (phase === "scene") {
      if (cueIndex < cueTotal - 1) {
        setCueIndex((i) => i + 1);
      } else if (episodeIndex < episodes.length - 1) {
        setEpisodeIndex((i) => i + 1);
        setCueIndex(0);
        setPhase("title");
      } else {
        setShowEnd(true);
      }
    }
  }

  useEffect(() => {
    if (playMode !== "auto" || isPaused || showEnd || !current) return;

    let delay = 2000;
    if (phase === "title") delay = current.card === "PROLOGUE" ? 2800 : 2400;
    if (phase === "black") delay = 650;
    if (phase === "scene") delay = cueDuration(currentCue);

    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
  }, [playMode, isPaused, showEnd, current, phase, currentCue, cueIndex, cueTotal, episodeIndex, episodes.length]);

  useEffect(() => {
    if (playMode !== "manual") return;
    function onClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest("button, a, input, [data-controls]")) return;
      advance();
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [playMode, phase, cueIndex, cueTotal, episodeIndex, episodes.length, showEnd, current]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === " ") {
        event.preventDefault();
        if (playMode === "manual") advance();
        else setIsPaused((p) => !p);
      }
      if (event.key === "ArrowRight") nextEpisode();
      if (event.key === "ArrowLeft") prevEpisode();
      if (event.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (showEnd) {
    return (
      <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <FilmNoise />
        <Letterbox />
        <EndCard onReplay={() => goEpisode(0)} />
        <Controls isPaused={isPaused} setIsPaused={setIsPaused} prevEpisode={prevEpisode} nextEpisode={nextEpisode} canPrev={episodeIndex > 0} isEnd playMode={playMode} setPlayMode={setPlayMode} />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white selection:bg-white selection:text-black">
      {current && <SceneStage design={current.design} phase={phase} />}
      <FilmNoise />
      <Letterbox />
      <ProgressBar current={episodeIndex} total={episodes.length} card={current?.card ?? ""} cueIndex={cueIndex} cueTotal={cueTotal} />
      <AnimatePresence>{phase === "title" && current && <BlackTitle key={`${episodeIndex}-title`} card={current.card} title={current.chapterTitle} />}</AnimatePresence>
      <AnimatePresence>
        {phase === "black" && (
          <motion.div key="blackout" className="absolute inset-0 z-20 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} />
        )}
      </AnimatePresence>
      {phase === "scene" && <Subtitle text={currentCue} playing={!isPaused} />}
      {playMode === "manual" && phase === "scene" && (
        <div className="pointer-events-none absolute bottom-[7vh] left-1/2 z-20 -translate-x-1/2 animate-pulse font-serif text-xs tracking-[0.3em] text-white/30">click to continue</div>
      )}
      <Controls isPaused={isPaused} setIsPaused={setIsPaused} prevEpisode={prevEpisode} nextEpisode={nextEpisode} canPrev={episodeIndex > 0} isEnd={false} playMode={playMode} setPlayMode={setPlayMode} />
    </main>
  );
}
