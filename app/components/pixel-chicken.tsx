"use client";

import { useEffect, useRef, useState } from "react";
import { PixelChickenFrameA, PixelChickenFrameB } from "@/app/components/pixel-art";
import { petChicken, subscribeFarm, type FarmState } from "@/app/lib/farm-state";
import { playCluck } from "@/app/lib/pixel-sfx";

const CLUCKS_ZH = [
  "咕咕！",
  "咕咕咕～",
  "咯咯哒！",
  "摸摸鸡头～",
  "今天也要加油鸭！",
  "咕？",
];
const CLUCKS_EN = [
  "Cluck!",
  "Bwok bwok!",
  "Coo coo~",
  "Head pats!",
  "Have a nice day!",
  "Cluck?",
];

/** Stardew-style pet chicken that wanders along the bottom of every page. */
export function PixelChicken() {
  const [frame, setFrame] = useState<0 | 1>(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [coinPop, setCoinPop] = useState(0);
  const [paused, setPaused] = useState(false);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const walk = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 320);
    return () => clearInterval(walk);
  }, []);

  useEffect(() => {
    const un = subscribeFarm(() => setCoinPop((n) => n + 1));
    return un;
  }, []);

  useEffect(() => {
    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, []);

  function handlePet() {
    const lang = document.documentElement.lang?.startsWith("zh") !== false;
    const lines = lang ? CLUCKS_ZH : CLUCKS_EN;
    setBubble(lines[Math.floor(Math.random() * lines.length)]);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 1600);

    playCluck();
    const result: { ok: boolean; state: FarmState } = petChicken();
    if (result.ok) setCoinPop((n) => n + 1);

    setPaused(true);
    setTimeout(() => setPaused(false), 900);
  }

  const Frame = frame === 0 ? PixelChickenFrameA : PixelChickenFrameB;

  return (
    <div
      className={`pixel-pet ${paused ? "paused" : ""}`}
      onClick={handlePet}
      role="button"
      aria-label="pet chicken"
      title="摸摸小鸡"
    >
      {bubble && <span className="pixel-pet-bubble">{bubble}</span>}
      <span key={coinPop} className="pixel-coin-pop" style={{ display: coinPop > 0 ? undefined : "none" }}>
        +1
      </span>
      <Frame className="pixel-pet-body" style={{ width: 42, height: 39 }} />
    </div>
  );
}