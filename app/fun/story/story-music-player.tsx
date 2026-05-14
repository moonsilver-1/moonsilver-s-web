"use client";

import { useEffect, useRef, useState } from "react";

const TRACKS = [
  { src: "/music/你就不要想起我.mp3", title: "你就不要想起我", artist: "田馥甄" },
];

export default function StoryMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const track = TRACKS[trackIndex];

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    });
    audio.addEventListener("ended", () => setPlaying(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.src;
    audio.load();
    if (playing) audio.play().catch(() => setPlaying(false));
  }, [trackIndex]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }

  function formatTime(s: number) {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {expanded && (
        <div className="w-72 overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="px-5 pt-4 pb-3">
            <p className="truncate text-sm font-medium text-white/90">{track.title}</p>
            <p className="truncate text-xs text-white/50">{track.artist}</p>
          </div>

          <div ref={progressRef} className="mx-5 cursor-pointer py-2" onClick={seek}>
            <div className="h-1 w-full rounded-full bg-white/10">
              <div className="h-full rounded-full bg-white/60 transition-[width] duration-200" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-white/35">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 px-5 pb-4">
            {TRACKS.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setTrackIndex((i) => (i + 1) % TRACKS.length);
                  setPlaying(true);
                }}
                className="text-white/50 transition-colors hover:text-white/80"
                aria-label="Next track"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5,4 15,12 5,20" fill="currentColor" stroke="none" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 backdrop-blur-md transition-all ${
          expanded ? "bg-white/10 text-white" : "bg-black/50 text-white/60 hover:bg-white/10 hover:text-white"
        }`}
        aria-label="Toggle music player"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" fill="currentColor" />
          <circle cx="18" cy="16" r="3" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
