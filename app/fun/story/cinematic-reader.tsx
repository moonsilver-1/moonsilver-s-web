"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Story } from "@/app/lib/story-content";

type SceneMeta = {
  title: string;
  card: string;
  kind: string;
  palette: [string, string, string];
};

const SCENES: SceneMeta[] = [
  { title: "序", card: "PROLOGUE", kind: "prologue", palette: ["#020617", "#0f172a", "#000000"] },
  { title: "断裂", card: "EPISODE 1", kind: "fracture", palette: ["#020617", "#1f2937", "#000000"] },
  { title: "桂花", card: "EPISODE 2", kind: "rain", palette: ["#020617", "#172554", "#000000"] },
  { title: "日记本与火影", card: "EPISODE 3", kind: "bedroom", palette: ["#0c0a09", "#292524", "#020617"] },
  { title: "人质", card: "EPISODE 4", kind: "classroom", palette: ["#0b080a", "#2a1219", "#020617"] },
  { title: "我不能输", card: "EPISODE 5", kind: "track", palette: ["#07111f", "#172554", "#3b0b0b"] },
  { title: "天台", card: "EPISODE 6", kind: "rooftop", palette: ["#020617", "#0f172a", "#000000"] },
  { title: "倒下的人", card: "EPISODE 7", kind: "emptyRoom", palette: ["#09090b", "#1f2937", "#020617"] },
  { title: "拉纳卡", card: "EPISODE 8", kind: "sea", palette: ["#020617", "#083344", "#000000"] },
  { title: "倒数第二", card: "EPISODE 9", kind: "stage", palette: ["#020617", "#111827", "#000000"] },
  { title: "我还在这里", card: "EPISODE 10", kind: "library", palette: ["#020617", "#0f172a", "#000000"] },
];

const POSTSCRIPT_SCENE: SceneMeta = {
  title: "航宁篇",
  card: "EPILOGUE",
  kind: "dorm",
  palette: ["#120b04", "#29200d", "#020617"],
};

function makeSubtitleCues(paragraphs: string[]) {
  const cues: string[] = [];
  for (const paragraph of paragraphs) {
    const sentences = paragraph
      .replaceAll("？", "？|")
      .replaceAll("。", "。|")
      .replaceAll("！", "！|")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    let buffer = "";
    for (const sentence of sentences) {
      if ((buffer + sentence).length <= 52) {
        buffer += sentence;
      } else {
        if (buffer) cues.push(buffer);
        buffer = sentence;
      }
    }
    if (buffer) cues.push(buffer);
  }
  return cues;
}

function cueDuration(text: string) {
  return Math.min(8500, Math.max(3600, 2300 + text.length * 105));
}

type Episode = {
  meta: SceneMeta;
  cues: string[];
};

function buildEpisodes(story: Story): Episode[] {
  return story.chapters.map((chapter, index) => {
    const meta =
      index < SCENES.length
        ? SCENES[index]
        : { ...POSTSCRIPT_SCENE, card: `EPISODE ${index + 1}` };
    return {
      meta,
      cues: makeSubtitleCues(chapter.paragraphs),
    };
  });
}

function FilmNoise() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 mix-blend-screen"
      style={{
        opacity: 0.012,
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "4px 4px",
      }}
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

function SceneBase({ children, palette }: { children: ReactNode; palette: SceneMeta["palette"] }) {
  const [a, b, c] = palette;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${a} 0%, ${b} 52%, ${c} 100%)` }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1.02, 1.08], opacity: [0.92, 1] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
      >
        {children}
      </motion.div>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 42%, transparent 0%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.78) 100%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.06) 58%, rgba(0,0,0,0.48))" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: "42vh", background: "linear-gradient(to top, rgba(0,0,0,0.94), transparent)" }}
      />
    </div>
  );
}

function RainLines({ petals = false }: { petals?: boolean }) {
  return (
    <>
      {Array.from({ length: 72 }).map((_, i) => (
        <motion.span
          key={`rain-${i}`}
          className="absolute block w-px"
          style={{
            left: `${(i * 19) % 100}%`,
            top: "-25%",
            height: 145,
            background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.55), transparent)",
          }}
          animate={{ y: [0, 1000], opacity: [0, 0.88, 0] }}
          transition={{ duration: 1.3 + (i % 8) * 0.1, repeat: Infinity, delay: (i % 26) * 0.05, ease: "linear" }}
        />
      ))}
      {petals &&
        Array.from({ length: 28 }).map((_, i) => (
          <motion.span
            key={`petal-${i}`}
            className="absolute rounded-full"
            style={{
              width: 4 + (i % 5),
              height: 4 + (i % 5),
              left: `${(i * 31) % 100}%`,
              top: `${-5 - (i % 20)}%`,
              background: "rgba(253,230,138,0.8)",
              boxShadow: "0 0 14px rgba(251,191,36,0.75)",
            }}
            animate={{ y: [0, 880], x: [0, i % 2 ? 90 : -90], opacity: [0, 1, 0] }}
            transition={{ duration: 8 + (i % 5), repeat: Infinity, delay: i * 0.21 }}
          />
        ))}
    </>
  );
}

function DustLayer({ tone = "rgba(255,255,255,0.14)", count = 24 }: { tone?: string; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2,
            height: 2,
            left: `${18 + ((i * 9) % 66)}%`,
            top: `${16 + ((i * 13) % 56)}%`,
            background: tone,
          }}
          animate={{ y: [0, -12, 0], opacity: [0.02, 0.18, 0.04] }}
          transition={{ duration: 5 + i * 0.11, repeat: Infinity }}
        />
      ))}
    </>
  );
}

function PrologueScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute rounded-3xl"
        style={{
          inset: "7%",
          background:
            "radial-gradient(circle at 34% 22%, rgba(125,211,252,0.14), transparent 22%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.995))",
          boxShadow: "0 0 140px rgba(56,189,248,0.08)",
        }}
      />
      <div
        className="absolute rounded-2xl"
        style={{
          left: "12%",
          top: "12%",
          width: "30%",
          height: "52%",
          border: "1px solid rgba(207,250,254,0.08)",
          background: "rgba(2,6,23,0.82)",
          overflow: "hidden",
        }}
      >
        <motion.div
          className="absolute rounded-full blur-xl"
          style={{ right: "13%", top: "12%", width: 80, height: 80, background: "rgba(207,250,254,0.32)" }}
          animate={{ opacity: [0.22, 0.52, 0.24] }}
          transition={{ duration: 5.5, repeat: Infinity }}
        />
        <div className="absolute inset-y-0" style={{ left: "8%", width: "24%", background: "rgba(2,6,23,0.95)" }} />
        <div className="absolute inset-y-0" style={{ right: "10%", width: "26%", background: "rgba(2,6,23,0.92)" }} />
      </div>
      <motion.div
        className="absolute blur-3xl"
        style={{
          left: "24%",
          top: "40%",
          width: "48%",
          height: "32%",
          rotate: "-13deg",
          background: "rgba(207,250,254,0.08)",
        }}
        animate={{ opacity: [0.07, 0.18, 0.08] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <div
        className="absolute"
        style={{
          bottom: "14%",
          left: "9%",
          width: "74%",
          height: "17%",
          borderRadius: "32px 32px 0 0",
          background: "rgba(0,0,0,0.74)",
          boxShadow: "0 -28px 90px rgba(0,0,0,0.72)",
        }}
      />
      <div
        className="absolute rounded-t-full"
        style={{ bottom: "17%", right: "18%", width: "17%", height: "44%", background: "rgba(0,0,0,0.80)", filter: "blur(0.4px)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ bottom: "55%", right: "22%", width: 80, height: 80, background: "rgba(0,0,0,0.86)" }}
      />
      <DustLayer tone="rgba(207,250,254,0.16)" count={24} />
    </SceneBase>
  );
}

function FractureScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <div
        className="absolute"
        style={{
          left: "16%",
          top: "7%",
          width: "68%",
          height: "70%",
          borderRadius: 10,
          background: "linear-gradient(to bottom, rgba(255,255,255,0.16), rgba(255,255,255,0.015))",
          filter: "blur(0.5px)",
        }}
      />
      <div
        className="absolute"
        style={{ left: "24%", top: "14%", width: "52%", height: "55%", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.10), transparent)" }}
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-[12%] h-[58%] w-px"
          style={{ left: `${23 + i * 7}%`, background: "rgba(255,255,255,0.12)" }}
          animate={{ opacity: [0.05, 0.18, 0.06] }}
          transition={{ duration: 3 + i * 0.18, repeat: Infinity }}
        />
      ))}
      <div className="absolute" style={{ left: "20%", right: "20%", bottom: "28%", height: 1, background: "rgba(255,255,255,0.18)" }} />
      <motion.div
        className="absolute rounded-full blur-sm"
        style={{ left: "48%", top: "32%", width: "9%", height: "38%", background: "rgba(0,0,0,0.55)" }}
        animate={{ opacity: [0.18, 0.34, 0.2], x: [0, -2, 2, 0] }}
        transition={{ duration: 5.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: ["rgba(255,255,255,0)", "rgba(255,255,255,0.06)", "rgba(255,255,255,0)"] }}
        transition={{ duration: 6.5, repeat: Infinity }}
      />
    </SceneBase>
  );
}

function OsmanthusScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <RainLines petals />
      <div className="absolute" style={{ left: 0, right: 0, bottom: "18%", height: "34%", background: "linear-gradient(to top, rgba(2,6,23,0.88), transparent)" }} />
      <div className="absolute" style={{ bottom: "23%", left: "9%", width: "82%", height: 1, background: "rgba(254,240,138,0.24)" }} />
      <div className="absolute rounded-t-full" style={{ bottom: "17%", left: "17%", width: 160, height: 288, background: "rgba(0,0,0,0.50)", filter: "blur(0.8px)" }} />
      <div
        className="absolute rounded-t-full"
        style={{ bottom: "24%", left: "63%", width: 260, height: 190, borderTop: "4px solid rgba(255,255,255,0.45)", background: "rgba(0,0,0,0.38)", filter: "blur(0.8px)" }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{ right: "18%", top: "25%", width: 128, height: 128, background: "rgba(253,230,138,0.30)" }}
        animate={{ opacity: [0.25, 0.78, 0.25] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </SceneBase>
  );
}

function BedroomScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <div className="absolute rounded-xl" style={{ left: "9%", top: "12%", width: "25%", height: "62%", background: "rgba(2,6,23,0.70)", boxShadow: "inset 0 0 80px rgba(125,211,252,0.08)" }} />
      <div className="absolute rounded-t-2xl" style={{ bottom: "17%", right: "11%", width: "60%", height: "32%", background: "rgba(120,53,15,0.58)", boxShadow: "0 -20px 70px rgba(251,191,36,0.08)" }} />
      <motion.div className="absolute rounded-full blur-3xl" style={{ right: "32%", top: "23%", width: 176, height: 176, background: "rgba(253,230,138,0.38)" }} animate={{ opacity: [0.45, 0.9, 0.45] }} transition={{ duration: 4.2, repeat: Infinity }} />
      <motion.div className="absolute" style={{ bottom: "35%", right: "27%", width: 176, height: 2, rotate: "4deg", background: "rgba(255,255,255,0.18)" }} animate={{ rotate: [3, 4.5, 3], opacity: [0.18, 0.34, 0.2] }} transition={{ duration: 5, repeat: Infinity }} />
      <div className="absolute rounded" style={{ bottom: "30%", right: "18%", width: 112, height: 64, background: "rgba(191,219,254,0.12)" }} />
      <div className="absolute rounded" style={{ bottom: "28%", right: "44%", width: 144, height: 96, rotate: "-6deg", background: "rgba(255,255,255,0.12)" }} />
      <DustLayer tone="rgba(253,230,138,0.18)" count={28} />
    </SceneBase>
  );
}

function ClassroomScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <motion.div className="absolute" style={{ left: 0, top: "10%", width: "100%", height: "42%", background: "linear-gradient(to right, rgba(254,205,211,0.18), rgba(255,255,255,0.07), transparent)" }} animate={{ opacity: [0.24, 0.42, 0.24] }} transition={{ duration: 6, repeat: Infinity }} />
      <div className="absolute" style={{ left: "10%", right: "10%", top: "23%", height: 1, background: "rgba(255,255,255,0.10)" }} />
      {Array.from({ length: 14 }).map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return <div key={i} className="absolute rounded-sm" style={{ left: `${16 + col * 20 + row * 1.5}%`, top: `${38 + row * 9}%`, width: `${13 - row * 1.2}%`, height: 40, background: "rgba(120,53,15,0.38)", boxShadow: "0 12px 24px rgba(0,0,0,0.35)" }} />;
      })}
      <motion.div className="absolute" style={{ left: "45%", top: "54%", width: 112, height: 16, rotate: "-8deg", background: "rgba(255,255,255,0.42)", boxShadow: "0 0 18px rgba(255,255,255,0.20)" }} animate={{ rotate: [-8, -6, -8], opacity: [0.34, 0.58, 0.36] }} transition={{ duration: 5, repeat: Infinity }} />
    </SceneBase>
  );
}

function TrackScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <motion.div className="absolute rounded-full blur-2xl" style={{ right: "15%", top: "17%", width: 112, height: 112, background: "rgba(255,255,255,0.26)" }} animate={{ opacity: [0.34, 0.72, 0.36] }} transition={{ duration: 4.5, repeat: Infinity }} />
      <div className="absolute" style={{ left: 0, right: 0, bottom: "9%", height: "52%", background: "linear-gradient(to top, rgba(127,29,29,0.88), rgba(127,29,29,0.38), transparent)" }} />
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div key={i} className="absolute" style={{ left: "-8%", bottom: `${16 + i * 5.6}%`, width: "116%", height: 1, rotate: `${-6 + i * 0.55}deg`, background: "rgba(255,255,255,0.24)" }} animate={{ opacity: [0.14, 0.46, 0.14] }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.08 }} />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full blur-sm" style={{ bottom: "25%", left: "18%", width: 120 + i * 36, height: 3, background: "rgba(254,215,170,0.42)" }} animate={{ x: [0, 680], opacity: [0, 0.7, 0] }} transition={{ duration: 1.8 + i * 0.06, repeat: Infinity, delay: i * 0.18 }} />
      ))}
    </SceneBase>
  );
}

function RooftopScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <RainLines />
      <div className="absolute" style={{ left: 0, right: 0, bottom: "29%", height: 1, background: "rgba(255,255,255,0.26)" }} />
      <div className="absolute" style={{ bottom: "24%", left: 0, right: 0, height: "19%", background: "rgba(0,0,0,0.50)" }} />
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div key={i} className="absolute" style={{ bottom: "28%", left: `${i * 6}%`, width: `${3 + (i % 4)}%`, height: 40 + (i % 5) * 22, background: "rgba(203,213,225,0.10)" }} animate={{ opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 4 + (i % 5), repeat: Infinity }} />
      ))}
      <motion.div className="absolute rounded-t-full" style={{ bottom: "34%", left: "30%", width: "11%", height: "36%", background: "rgba(0,0,0,0.68)", filter: "blur(0.6px)" }} animate={{ x: [0, 4, 0], opacity: [0.55, 0.72, 0.56] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div className="absolute rounded" style={{ bottom: "48%", left: "39%", width: 20, height: 28, background: "rgba(207,250,254,0.52)", boxShadow: "0 0 20px rgba(125,211,252,0.9)" }} animate={{ opacity: [0.15, 0.7, 0.18] }} transition={{ duration: 5.2, repeat: Infinity }} />
    </SceneBase>
  );
}

function EmptyRoomScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <motion.div className="absolute" style={{ right: "10%", top: "15%", width: "30%", height: "44%", background: "rgba(255,255,255,0.08)" }} animate={{ opacity: [0.10, 0.22, 0.11] }} transition={{ duration: 7, repeat: Infinity }} />
      <div className="absolute rounded" style={{ bottom: "20%", left: "28%", width: "50%", height: "30%", background: "rgba(28,25,23,0.68)", boxShadow: "0 -18px 70px rgba(0,0,0,0.45)" }} />
      <div className="absolute" style={{ bottom: "18%", left: "18%", width: 96, height: 176, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.34)" }} />
      <motion.div className="absolute" style={{ bottom: "39%", left: "42%", width: 208, height: 64, rotate: "4deg", background: "rgba(255,255,255,0.14)" }} animate={{ rotate: [3.5, 4.5, 3.5], opacity: [0.12, 0.26, 0.13] }} transition={{ duration: 6, repeat: Infinity }} />
      <DustLayer count={24} />
    </SceneBase>
  );
}

function SeaScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <div className="absolute rounded-full" style={{ left: "10%", top: "14%", width: 64, height: 64, background: "rgba(255,255,255,0.78)", boxShadow: "0 0 90px rgba(255,255,255,0.75)" }} />
      <div className="absolute" style={{ left: "8%", top: "17%", width: "78%", height: 1, background: "rgba(207,250,254,0.16)" }} />
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div key={i} className="absolute rounded-full" style={{ left: "-10%", bottom: `${8 + i * 4.8}%`, width: "120%", height: 80, border: "1px solid rgba(207,250,254,0.20)" }} animate={{ x: [0, 50, 0], opacity: [0.08, 0.34, 0.08] }} transition={{ duration: 5 + i * 0.28, repeat: Infinity }} />
      ))}
      <motion.div className="absolute rounded-t-full" style={{ bottom: "22%", left: "20%", width: "12%", height: "42%", background: "rgba(0,0,0,0.72)", filter: "blur(0.5px)" }} animate={{ x: [0, 3, 0], opacity: [0.68, 0.82, 0.7] }} transition={{ duration: 5.5, repeat: Infinity }} />
      <div className="absolute rounded-full" style={{ bottom: "56%", left: "23%", width: 64, height: 64, background: "rgba(0,0,0,0.80)" }} />
      <motion.div className="absolute rounded-full" style={{ bottom: "27%", right: "20%", width: 24, height: 24, border: "2px solid rgba(207,250,254,0.80)", boxShadow: "0 0 24px rgba(125,211,252,0.95)" }} animate={{ opacity: [0.35, 1, 0.38], scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }} />
    </SceneBase>
  );
}

function StageScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <motion.div className="absolute blur-3xl" style={{ left: "41%", top: 0, width: 288, height: "80%", background: "rgba(255,255,255,0.14)" }} animate={{ opacity: [0.22, 0.64, 0.24] }} transition={{ duration: 4.5, repeat: Infinity }} />
      <div className="absolute rounded-t-full" style={{ bottom: "26%", left: "48%", width: "8%", height: "28%", background: "rgba(0,0,0,0.74)" }} />
      <div className="absolute" style={{ bottom: "15%", left: 0, right: 0, height: "22%", background: "rgba(0,0,0,0.72)" }} />
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="absolute rounded-t-full blur-sm" style={{ bottom: "13%", left: `${i * 7.5}%`, width: `${4 + (i % 3)}%`, height: 80, background: "rgba(0,0,0,0.75)" }} />
      ))}
    </SceneBase>
  );
}

function LibraryScene({ palette }: { palette: SceneMeta["palette"] }) {
  const echoes = [
    "我还在这里", "我一直都在", "请你一直记得我", "我会一直陪着你",
    "我还在这里", "我一直都在", "请你一直记得我",
    "我还在这里", "我会一直陪着你",
  ];
  return (
    <SceneBase palette={palette}>
      <div className="absolute" style={{ left: "7%", top: "12%", width: "36%", height: "60%", background: "rgba(207,250,254,0.07)" }} />
      <div className="absolute rounded" style={{ bottom: "17%", left: "42%", width: "43%", height: "35%", background: "rgba(120,53,15,0.32)" }} />
      <motion.div className="absolute rounded-full blur-3xl" style={{ right: "28%", top: "35%", width: 176, height: 176, background: "rgba(253,230,138,0.30)" }} animate={{ opacity: [0.32, 0.82, 0.32] }} transition={{ duration: 4.4, repeat: Infinity }} />
      <div className="absolute rounded-t-full" style={{ bottom: "27%", left: "46%", width: "10%", height: "32%", background: "rgba(0,0,0,0.68)" }} />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute" style={{ right: "8%", top: `${17 + i * 4.8}%`, width: 176, height: 3, background: "rgba(255,255,255,0.07)" }} />
      ))}
      {echoes.map((word, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const size = 18 + (i % 4) * 6;
        const maxOp = 0.22 + (i === 0 ? 0.28 : i % 3 === 0 ? 0.14 : 0.06);
        return (
          <motion.div
            key={`echo-${i}`}
            className="absolute whitespace-nowrap font-serif text-white"
            style={{
              left: `${6 + col * 32}%`,
              top: `${10 + row * 22 + (i % 2) * 8}%`,
              fontSize: size,
              letterSpacing: "0.18em",
              filter: `blur(${i === 0 ? 0 : 1 + (i % 3)}px)`,
            }}
            animate={{
              opacity: [0.03, maxOp, 0.03],
              y: [0, -(18 + i * 3), 0],
              x: [0, (i % 2 ? 6 : -6), 0],
            }}
            transition={{ duration: 5 + i * 0.8, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          >
            {word}
          </motion.div>
        );
      })}
      <DustLayer tone="rgba(253,230,138,0.22)" count={36} />
    </SceneBase>
  );
}

function DormScene({ palette }: { palette: SceneMeta["palette"] }) {
  return (
    <SceneBase palette={palette}>
      <div className="absolute" style={{ left: "7%", top: "14%", width: "26%", height: "58%", background: "rgba(30,58,138,0.28)" }} />
      <div className="absolute rounded" style={{ bottom: "17%", left: "19%", width: "66%", height: "35%", background: "rgba(120,53,15,0.58)", boxShadow: "0 -20px 70px rgba(251,191,36,0.06)" }} />
      <motion.div className="absolute rounded-full blur-3xl" style={{ right: "34%", top: "24%", width: 192, height: 192, background: "rgba(253,230,138,0.42)" }} animate={{ opacity: [0.38, 0.9, 0.4] }} transition={{ duration: 4, repeat: Infinity }} />
      <div className="absolute rounded-xl" style={{ bottom: "34%", left: "47%", width: 96, height: 112, background: "rgba(255,255,255,0.16)" }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div key={i} className="absolute w-px blur-sm" style={{ bottom: "45%", left: "50%", marginLeft: i * 8, height: 64, background: "rgba(255,255,255,0.16)" }} animate={{ y: [0, -28, -44], opacity: [0, 0.28, 0] }} transition={{ duration: 3 + i * 0.2, repeat: Infinity, delay: i * 0.25 }} />
      ))}
      <div className="absolute" style={{ bottom: "30%", left: "39%", width: 112, height: 36, background: "rgba(220,252,231,0.16)" }} />
      <div className="absolute" style={{ bottom: "24%", right: "18%", width: 240, height: 80, rotate: "3deg", background: "rgba(37,99,235,0.18)" }} />
    </SceneBase>
  );
}

function SceneVisual({ meta }: { meta: SceneMeta }) {
  const props = { palette: meta.palette };
  switch (meta.kind) {
    case "prologue": return <PrologueScene {...props} />;
    case "fracture": return <FractureScene {...props} />;
    case "rain": return <OsmanthusScene {...props} />;
    case "bedroom": return <BedroomScene {...props} />;
    case "classroom": return <ClassroomScene {...props} />;
    case "track": return <TrackScene {...props} />;
    case "rooftop": return <RooftopScene {...props} />;
    case "emptyRoom": return <EmptyRoomScene {...props} />;
    case "sea": return <SeaScene {...props} />;
    case "stage": return <StageScene {...props} />;
    case "library": return <LibraryScene {...props} />;
    case "dorm": return <DormScene {...props} />;
    default: return <PrologueScene {...props} />;
  }
}

function BlackTitle({ meta }: { meta: SceneMeta }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.75 }}
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
        transition={{ duration: 1.1 }}
      >
        {meta.card !== "PROLOGUE" && (
          <div className="mb-5 font-serif text-sm tracking-[0.6em] text-white/55 md:text-base">{meta.card}</div>
        )}
        <div className="font-serif text-5xl font-semibold tracking-[0.18em] text-white md:text-8xl">
          {meta.card === "PROLOGUE" ? "PROLOGUE" : meta.title}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SceneBackground({ meta, phase }: { meta: SceneMeta; phase: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.02, opacity: 0 }}
        animate={{ scale: phase === "scene" ? 1.08 : 1.02, opacity: phase === "scene" ? 1 : 0.45 }}
        transition={{ scale: { duration: 34, ease: "linear" }, opacity: { duration: 1.1 } }}
      >
        <SceneVisual meta={meta} />
      </motion.div>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, transparent 0%, rgba(0,0,0,0.03) 44%, rgba(0,0,0,0.64) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.86), rgba(0,0,0,0.05), rgba(0,0,0,0.46))" }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: "42vh", background: "linear-gradient(to top, rgba(0,0,0,0.94), transparent)" }} />
    </div>
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
        <p className="font-serif text-2xl leading-[1.85] tracking-[0.12em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)] md:text-[2rem]">
          {text}
        </p>
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
      <button onClick={prevEpisode} disabled={!canPrev} className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20 disabled:opacity-30">
        Previous
      </button>
      {playMode === "auto" && (
        <button onClick={() => setIsPaused((p) => !p)} className="rounded-full bg-white px-5 py-2 font-medium text-black transition hover:scale-[1.03]">
          {isPaused ? "Play" : "Pause"}
        </button>
      )}
      <button onClick={nextEpisode} className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20">
        {isEnd ? "Replay" : "Next Episode"}
      </button>
      <div className="mx-1 h-5 w-px bg-white/15" />
      <button
        onClick={() => setPlayMode((m) => (m === "auto" ? "manual" : "auto"))}
        className="rounded-full bg-white/10 px-4 py-2 transition hover:bg-white/20"
        title={playMode === "auto" ? "切换到手动播放" : "切换到自动播放"}
      >
        {playMode === "auto" ? "Auto" : "Manual"}
      </button>
    </div>
  );
}

function ProgressBar({ current, total, cueIndex, cueTotal }: { current: number; total: number; cueIndex: number; cueTotal: number }) {
  const episodePct = total <= 1 ? 0 : current / (total - 1);
  const cuePct = cueTotal <= 1 ? 0 : cueIndex / Math.max(1, cueTotal - 1);
  return (
    <div className="fixed left-1/2 top-[88px] z-50 w-[min(820px,82vw)] -translate-x-1/2">
      <div className="mb-2 flex justify-between font-serif text-[10px] uppercase tracking-[0.35em] text-white/45">
        <span>{current === 0 ? "PROLOGUE" : `EPISODE ${String(current).padStart(2, "0")}`}</span>
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
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "rgba(103,232,249,0.08)" }} />
      <div className="absolute inset-0" style={{ opacity: 0.08, backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "4px 4px" }} />
    </div>
  );
}

function EndCard({ onReplay }: { onReplay: () => void }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-center">
      <EndScene />
      <motion.div className="relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.3 }}>
        <div className="font-serif text-5xl tracking-[0.18em] text-white md:text-8xl">END OF STORY</div>
        <p className="mt-8 font-serif text-xl tracking-[0.18em] text-white/70 md:text-2xl">故事没有结束，只是叙述先到这里。</p>
        <button onClick={onReplay} className="mt-12 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm tracking-[0.2em] text-white/80 backdrop-blur transition hover:bg-white hover:text-black">
          REPLAY
        </button>
      </motion.div>
    </section>
  );
}

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
    if (phase === "title") delay = current.meta.card === "PROLOGUE" ? 2800 : 2400;
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
      <SceneBackground meta={current.meta} phase={phase} />
      <FilmNoise />
      <Letterbox />
      <ProgressBar current={episodeIndex} total={episodes.length} cueIndex={cueIndex} cueTotal={cueTotal} />
      <AnimatePresence>{phase === "title" && <BlackTitle key={`${episodeIndex}-title`} meta={current.meta} />}</AnimatePresence>
      <AnimatePresence>
        {phase === "black" && (
          <motion.div
            key="blackout"
            className="absolute inset-0 z-20 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          />
        )}
      </AnimatePresence>
      {phase === "scene" && <Subtitle text={currentCue} playing={!isPaused} />}
      {playMode === "manual" && phase === "scene" && (
        <div className="pointer-events-none absolute bottom-[7vh] left-1/2 z-20 -translate-x-1/2 animate-pulse font-serif text-xs tracking-[0.3em] text-white/30">
          click to continue
        </div>
      )}
      <Controls isPaused={isPaused} setIsPaused={setIsPaused} prevEpisode={prevEpisode} nextEpisode={nextEpisode} canPrev={episodeIndex > 0} isEnd={false} playMode={playMode} setPlayMode={setPlayMode} />
    </main>
  );
}
