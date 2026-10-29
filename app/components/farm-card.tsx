"use client";

import { useEffect, useState } from "react";
import {
  checkInToday,
  cropStage,
  readFarmState,
  subscribeFarm,
  todayKey,
  type FarmState,
} from "@/app/lib/farm-state";
import { useSiteLanguage } from "@/app/components/language-provider";
import { PixelBush, PixelCarrot, PixelSprout } from "@/app/components/pixel-art";
import { playCoin } from "@/app/lib/pixel-sfx";

const copy = {
  zh: {
    title: "农场签到",
    checkIn: "签到",
    checkedIn: "今天已签到",
    streak: "连击",
    days: "天",
    reward: "获得",
    coinName: "金币",
    total: "累计签到",
    cropLabel: "作物",
    tomorrow: "明天再来哦～",
  },
  en: {
    title: "Farm Check-in",
    checkIn: "Check in",
    checkedIn: "Checked in today",
    streak: "Streak",
    days: "d",
    reward: "Earned",
    coinName: "coins",
    total: "Total",
    cropLabel: "Crop",
    tomorrow: "Come back tomorrow!",
  },
} as const;

export function FarmCard() {
  const { language } = useSiteLanguage();
  const [state, setState] = useState<FarmState | null>(null);
  const [lastReward, setLastReward] = useState<number | null>(null);

  useEffect(() => {
    setState(readFarmState());
    return subscribeFarm(() => setState(readFarmState()));
  }, []);

  const labels = copy[language];
  const checkedInToday = state?.lastCheckIn === todayKey();
  const crop = cropStage(state?.totalCheckIns ?? 0);

  function handleCheckIn() {
    const result = checkInToday();
    if (result.ok) {
      playCoin();
      setLastReward(result.reward);
      setState(result.state);
      setTimeout(() => setLastReward(null), 2400);
    }
  }

  const CropArt = crop.stage === 0 ? null : crop.stage <= 2 ? PixelSprout : crop.stage === 3 ? PixelBush : PixelCarrot;

  return (
    <div className="pixel-panel relative mx-auto w-full max-w-md p-5 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="pixel-section-label">{labels.title}</span>
        <span className="pixel-coin">
          <span className="pixel-coin-dot" />
          {state?.coins ?? 0}
        </span>
      </div>

      <div className="pixel-inset mb-4 flex items-center gap-4 p-4">
        <div className="relative flex h-16 w-16 shrink-0 items-end justify-center border-2 border-[var(--sv-border)] bg-[var(--sv-grass)]">
          <div className="absolute inset-x-0 bottom-0 h-3 bg-[var(--sv-ground)]" />
          {CropArt ? (
            <CropArt
              className="relative mb-1"
              style={{ width: crop.stage === 4 ? 24 : 28, height: crop.stage === 4 ? 40 : 24 }}
            />
          ) : (
            <span className="relative mb-1 h-2.5 w-2.5 bg-[var(--sv-wood-lo)]" />
          )}
        </div>
        <div className="min-w-0 text-sm leading-6">
          <p>
            {labels.cropLabel}: <strong>{crop.label[language]}</strong>
          </p>
          <p className="text-[var(--app-muted)]">
            {labels.total}: {state?.totalCheckIns ?? 0}
          </p>
          <p className="text-[var(--app-muted)]">
            {labels.streak}: {state?.streak ?? 0} {labels.days}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckIn}
        disabled={!state || checkedInToday}
        className={`pixel-btn w-full ${checkedInToday ? "" : "pixel-btn-gold"}`}
      >
        {checkedInToday ? `✔ ${labels.checkedIn}` : `★ ${labels.checkIn}`}
      </button>

      {lastReward !== null && (
        <span className="pixel-coin-pop absolute bottom-14 left-1/2 -translate-x-1/2 !text-base">
          +{lastReward} {labels.coinName}
        </span>
      )}

      {checkedInToday && (
        <p className="mt-2 text-center text-xs text-[var(--app-muted)]">{labels.tomorrow}</p>
      )}
    </div>
  );
}
