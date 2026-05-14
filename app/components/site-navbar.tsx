"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/components/auth-provider";
import { useSiteLanguage } from "@/app/components/language-provider";

const navLabels = {
  zh: {
    home: "首页",
    fun: "娱乐",
    blog: "博客",
    contest: "竞赛专区",
    login: "登录",
    logout: "退出",
    themeDark: "切换到白天模式",
    themeLight: "切换到黑夜模式",
    language: "EN",
    switchLanguage: "切换到英文",
  },
  en: {
    home: "Home",
    fun: "Fun",
    blog: "Blog",
    contest: "Contest",
    login: "Log in",
    logout: "Log out",
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
    return "dark";
  }

  const storedTheme = window.localStorage.getItem("site-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function SiteNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useSiteLanguage();
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const [pendingCount, setPendingCount] = useState(0);

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

  useEffect(() => {
    if (!user?.isAdmin) {
      setPendingCount(0);
      return;
    }

    let active = true;

    async function loadPendingCount() {
      try {
        const response = await fetch("/api/auth?admin=users");
        const data = (await response.json().catch(() => null)) as { users?: { status?: string }[] } | null;

        if (!active || !response.ok || !data?.users) {
          return;
        }

        setPendingCount(data.users.filter((item) => item.status === "pending").length);
      } catch {
        // Ignore transient fetch errors; the next poll will retry.
      }
    }

    const refresh = () => {
      void loadPendingCount();
    };

    refresh();
    const interval = window.setInterval(refresh, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.isAdmin]);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--app-border)] bg-[var(--app-surface)]/85 px-6 py-4 backdrop-blur-md transition-colors duration-300 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="select-none text-sm font-semibold uppercase tracking-widest text-[var(--app-fg)]"
          >
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
            <Link
              href={user ? "/account" : "/account/login"}
              className="relative rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
            >
              {user ? user.username : labels.login}
              {user?.isAdmin && pendingCount > 0 ? (
                <span
                  aria-label={`${pendingCount} pending account requests`}
                  className="absolute -right-1 -top-1 min-w-[20px] rounded-full border border-rose-500/30 bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white"
                >
                  {pendingCount}
                </span>
              ) : null}
            </Link>
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
              >
                {labels.logout}
              </button>
            ) : null}
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
