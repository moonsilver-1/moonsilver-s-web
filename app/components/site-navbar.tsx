"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useScene } from "@/app/components/scene-provider";
import { SCENES, SCENE_KEYS, type SceneKey } from "@/app/lib/scene-config";

const navLabels = {
  zh: {
    home: "首页",
    fun: "娱乐",
    blog: "博客",
    themeDark: "切换到白天模式",
    themeLight: "切换到黑夜模式",
    language: "EN",
    switchLanguage: "切换到英文",
    scenePicker: "切换场景",
  },
  en: {
    home: "Home",
    fun: "Fun",
    blog: "Blog",
    themeDark: "Switch to light mode",
    themeLight: "Switch to dark mode",
    language: "中",
    switchLanguage: "Switch to Chinese",
    scenePicker: "Change scene",
  },
} as const;

const links = [
  { href: "/", key: "home" },
  { href: "/fun", key: "fun" },
  { href: "/blog", key: "blog" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href;
}

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  const storedTheme = window.localStorage.getItem("site-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function ScenePicker({ language }: { language: "zh" | "en" }) {
  const { scene, setScene } = useScene();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  const current = SCENES[scene];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={navLabels[language].scenePicker}
        className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-all duration-200 hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] hover:shadow-sm active:scale-95"
      >
        <span aria-hidden="true">{current.icon}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[140px] overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-xl backdrop-blur-xl">
          {SCENE_KEYS.map((key) => {
            const s = SCENES[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setScene(key); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                  scene === key
                    ? "bg-[var(--app-border)] text-[var(--app-fg)]"
                    : "text-[var(--app-muted)] hover:bg-[var(--app-border)] hover:text-[var(--app-fg)]"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center text-sm leading-none">{s.icon}</span>
                <span className="text-xs font-medium leading-none">{s.label[language]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SiteNavbar() {
  const pathname = usePathname();
  const { language, setLanguage } = useSiteLanguage();
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("site-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const labels = useMemo(() => navLabels[language], [language]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function toggleLanguage() {
    setLanguage(language === "en" ? "zh" : "en");
  }

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 border-b border-[var(--app-border)] px-6 py-3.5 backdrop-blur-xl transition-all duration-500 md:px-12 ${
        scrolled
          ? "bg-[var(--app-surface)]/95 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          : "bg-[var(--app-surface)]/70"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-brand select-none text-sm font-semibold uppercase tracking-[0.2em] text-[var(--app-fg)] transition-opacity hover:opacity-70"
          >
            MOONSILVER
          </Link>

          <div className="flex items-center gap-2 lg:hidden">
            <ScenePicker language={language} />
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={labels.switchLanguage}
              className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-all duration-200 hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] hover:shadow-sm active:scale-95"
            >
              {labels.language}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? labels.themeDark : labels.themeLight}
              className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-all duration-200 hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] hover:shadow-sm active:scale-95"
            >
              <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-1 flex h-8 w-8 flex-col items-center justify-center gap-1.5 rounded-full border border-[var(--app-border)] transition-colors hover:border-[var(--app-border-strong)]"
              aria-label="Menu"
            >
              <span
                className={`block h-px w-4 bg-[var(--app-fg)] transition-all duration-300 ${
                  mobileMenuOpen ? "translate-y-[3.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-px w-4 bg-[var(--app-fg)] transition-all duration-300 ${
                  mobileMenuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div
          className={`flex-col gap-4 overflow-hidden transition-all duration-300 lg:flex-row lg:items-center lg:justify-end lg:overflow-visible ${
            mobileMenuOpen ? "flex max-h-40 opacity-100" : "flex max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
          }`}
        >
          <ul className="flex flex-wrap gap-5 md:gap-7">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group relative text-sm tracking-wide transition-colors ${
                      active ? "text-[var(--app-fg)]" : "text-[var(--app-muted)] hover:text-[var(--app-fg)]"
                    }`}
                  >
                    {labels[link.key]}
                    <span
                      className={`absolute -bottom-1 left-1/2 h-px -translate-x-1/2 bg-[var(--app-fg)] transition-all duration-300 ease-out ${
                        active ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden lg:block">
              <ScenePicker language={language} />
            </div>
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={labels.switchLanguage}
              className="hidden rounded-full border border-[var(--app-border)] px-3.5 py-2 text-xs text-[var(--app-muted)] transition-all duration-200 hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] hover:shadow-sm active:scale-95 lg:inline-flex"
            >
              {labels.language}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? labels.themeDark : labels.themeLight}
              className="hidden rounded-full border border-[var(--app-border)] px-3.5 py-2 text-xs text-[var(--app-muted)] transition-all duration-200 hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] hover:shadow-sm active:scale-95 lg:inline-flex"
            >
              <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
