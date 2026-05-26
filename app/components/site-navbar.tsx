"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";

const navLabels = {
  zh: {
    home: "首页",
    fun: "娱乐",
    blog: "博客",
    themeDark: "切换到白天模式",
    themeLight: "切换到黑夜模式",
    language: "EN",
    switchLanguage: "切换到英文",
  },
  en: {
    home: "Home",
    fun: "Fun",
    blog: "Blog",
    themeDark: "Switch to light mode",
    themeLight: "Switch to dark mode",
    language: "中",
    switchLanguage: "Switch to Chinese",
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
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("site-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function SiteNavbar() {
  const pathname = usePathname();
  const { language, setLanguage } = useSiteLanguage();
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("site-theme", theme);
  }, [theme]);

  const labels = useMemo(() => navLabels[language], [language]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function toggleLanguage() {
    setLanguage(language === "en" ? "zh" : "en");
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--app-border)] bg-[var(--app-surface)]/85 px-6 py-4 backdrop-blur-md transition-colors duration-300 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="select-none text-sm font-semibold uppercase tracking-widest text-[var(--app-fg)]">
            MOONSILVER
          </Link>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={labels.switchLanguage}
              className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
            >
              {labels.language}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? labels.themeDark : labels.themeLight}
              className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
            >
              <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
          <ul className="flex flex-wrap gap-4 md:gap-6">
            {links.map((link) => {
              const active = isActive(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative text-sm tracking-wide transition-colors ${
                      active ? "text-[var(--app-fg)]" : "text-[var(--app-muted)] hover:text-[var(--app-fg)]"
                    }`}
                  >
                    {labels[link.key]}
                    {active ? <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--app-fg)]" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={labels.switchLanguage}
              className="hidden rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] lg:inline-flex"
            >
              {labels.language}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? labels.themeDark : labels.themeLight}
              className="hidden rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] lg:inline-flex"
            >
              <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
