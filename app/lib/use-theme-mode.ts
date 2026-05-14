"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
