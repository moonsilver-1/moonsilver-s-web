"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { readFarmState, subscribeFarm } from "@/app/lib/farm-state";
import { playSweep } from "@/app/lib/pixel-sfx";

const navLabels = {
  zh: {
    home: "首页",
    fun: "娱乐",
    blog: "博客",
    study: "学习",
    themeDark: "切换到夜间模式",
    themeLight: "切换到白天模式",
    language: "EN",
    switchLanguage: "切换到英文",
  },
  en: {
    home: "Home",
    fun: "Fun",
    blog: "Blog",
    study: "Study",
    themeDark: "Switch to night mode",
    themeLight: "Switch to day mode",
    language: "中",
    switchLanguage: "Switch to Chinese",
  },
} as const;

const links = [
  { href: "/", key: "home" },
  { href: "/fun", key: "fun" },
  { href: "/blog", key: "blog" },
  { href: "/study/mimo-radar", key: "study" },
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

export function SiteNavbar() {
  const pathname = usePathname();
  const { language, setLanguage } = useSiteLanguage();
  // Start from the SSR value; sync the stored preference after mount to
  // keep hydration consistent (the inline head script already applied it pre-paint).
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coins, setCoins] = useState(0);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("site-theme", theme);
  }, [theme]);

  useEffect(() => {
    setCoins(readFarmState().coins);
    return subscribeFarm(() => setCoins(readFarmState().coins));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const labels = useMemo(() => navLabels[language], [language]);

  function toggleTheme() {
    setSweeping(true);
    playSweep();
    window.setTimeout(() => setSweeping(false), 620);
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function toggleLanguage() {
    setLanguage(language === "en" ? "zh" : "en");
  }

  return (
    <nav className={`pixel-navbar fixed left-0 right-0 top-0 z-50 px-4 py-2.5 transition-shadow duration-300 md:px-10 ${scrolled ? "pixel-navbar-solid" : ""}`}>
      {sweeping && <span className="theme-sweep" aria-hidden="true" />}
      <div className="mx-auto flex max-w-7xl flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-brand flex select-none items-center gap-2 text-[13px] text-[#fff3d0]"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.45)" }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 bg-[var(--sv-gold)] shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.3),inset_2px_2px_0_var(--sv-gold-hi)]"
            />
            MOONSILVER
          </Link>

          <div className="flex items-center gap-1.5 lg:hidden">
            <span className="pixel-coin">
              <span className="pixel-coin-dot" />
              {coins}
            </span>
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={labels.switchLanguage}
              className="pixel-btn !px-2.5 !py-1.5 !text-xs"
            >
              {labels.language}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? labels.themeDark : labels.themeLight}
              className="pixel-btn !px-2.5 !py-1.5 !text-xs"
            >
              <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="pixel-btn !px-2.5 !py-1.5 !text-xs"
              aria-label="Menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        <div
          className={`flex-col gap-3 overflow-hidden transition-all duration-300 lg:flex-row lg:items-center lg:justify-end lg:overflow-visible ${
            mobileMenuOpen ? "flex max-h-48 opacity-100" : "flex max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
          }`}
        >
          <ul className="flex flex-wrap items-center gap-1 md:gap-1.5">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`pixel-btn !px-3 !py-1.5 !text-[13px] ${active ? "pixel-btn-green" : ""}`}
                  >
                    {labels[link.key]}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5">
            <span className="pixel-coin hidden sm:inline-flex">
              <span className="pixel-coin-dot" />
              {coins}
            </span>
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={labels.switchLanguage}
              className="pixel-btn hidden !px-3 !py-1.5 !text-xs lg:inline-flex"
            >
              {labels.language}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? labels.themeDark : labels.themeLight}
              className="pixel-btn hidden !px-3 !py-1.5 !text-xs lg:inline-flex"
            >
              <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
