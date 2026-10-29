"use client";

import { useMemo } from "react";
import { useThemeMode } from "@/app/lib/use-theme-mode";
import { dailyWeather } from "@/app/lib/farm-state";
import { PixelCloud, PixelMoon, PixelSun } from "@/app/components/pixel-art";

type Placed = { left: string; top: string; delay: string; duration: string; scale: number };

function place(count: number, seed: number, spread: number): Placed[] {
  return Array.from({ length: count }, (_, i) => ({
    left: `${((i * 61 + seed * 17) % 96) + 2}%`,
    top: `${((i * 37 + seed * 29) % spread) + 4}%`,
    delay: `${-((i * 13 + seed * 7) % 60)}s`,
    duration: `${46 + ((i * 11 + seed * 3) % 40)}s`,
    scale: 1.6 + ((i * 7 + seed) % 3) * 0.8,
  }));
}

export function PixelSceneBg() {
  const theme = useThemeMode();
  const weather = useMemo(() => dailyWeather(), []);
  const isDay = theme === "light";

  const clouds = useMemo(() => place(weather === "cloudy" ? 7 : 4, 3, 26), [weather]);
  const stars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: `${(i * 37 + 11) % 99}%`,
        top: `${(i * 23 + 5) % 58}%`,
        delay: `${((i * 7) % 26) / 10}s`,
        size: i % 5 === 0 ? 5 : 3,
      })),
    [],
  );
  const fireflies = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        left: `${((i * 43 + 19) % 88) + 6}%`,
        top: `${62 + ((i * 13) % 26)}%`,
        delay: `${-(i * 2.3)}s`,
      })),
    [],
  );
  const rainDrops = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        left: `${((i * 29 + 3) % 106) - 3}%`,
        height: `${16 + ((i * 7) % 18)}px`,
        delay: `${((i * 11) % 22) / 10}s`,
        duration: `${0.9 + ((i * 3) % 5) / 10}s`,
      })),
    [],
  );
  const windStreaks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        top: `${12 + i * 13}%`,
        width: `${90 + (i % 3) * 60}px`,
        delay: `${i * 1.4}s`,
      })),
    [],
  );

  return (
    <div className="pixel-scene pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {isDay ? (
        <>
          <PixelSun
            className="pixel-orb pixel-orb-sun"
            style={{ left: "12%", top: "13%", width: 72, height: 72 }}
          />
          {clouds.map((c, i) => (
            <PixelCloud
              key={`cloud-${i}`}
              className="pixel-cloud"
              style={{
                left: 0,
                top: c.top,
                width: 60 * c.scale,
                height: 30 * c.scale,
                animationDelay: c.delay,
                animationDuration: c.duration,
              }}
            />
          ))}
          {weather === "rainy" &&
            rainDrops.map((d, i) => (
              <span
                key={`rain-${i}`}
                className="pixel-rain"
                style={{ left: d.left, height: d.height, animationDelay: d.delay, animationDuration: d.duration }}
              />
            ))}
          {weather === "windy" &&
            windStreaks.map((w, i) => (
              <span
                key={`wind-${i}`}
                className="pixel-wind"
                style={{ top: w.top, width: w.width, animationDelay: w.delay }}
              />
            ))}
        </>
      ) : (
        <>
          <PixelMoon
            className="pixel-orb pixel-orb-moon"
            style={{ right: "14%", top: "11%", width: 52, height: 52 }}
          />
          {stars.map((s, i) => (
            <span
              key={`star-${i}`}
              className="pixel-star"
              style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
            />
          ))}
          <span className="pixel-shooting" />
          {fireflies.map((f, i) => (
            <span
              key={`fly-${i}`}
              className="pixel-firefly"
              style={{ left: f.left, top: f.top, animationDelay: f.delay }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/** Backwards-compatible alias: old pages imported AutumnLeavesBg. */
export const AutumnLeavesBg = PixelSceneBg;
