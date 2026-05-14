"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  type SiteLanguage,
  htmlLang,
  normalizeSiteLanguage,
} from "@/app/lib/site-language";

type LanguageContextValue = {
  language: SiteLanguage;
  setLanguage: (language: SiteLanguage) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  return normalizeSiteLanguage(window.localStorage.getItem("site-lang"));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>(readInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem("site-lang", language);
    document.documentElement.lang = htmlLang(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    function setLanguage(nextLanguage: SiteLanguage) {
      setLanguageState(nextLanguage);
    }

    function toggleLanguage() {
      setLanguageState((current) => (current === "en" ? "zh" : "en"));
    }

    return {
      language,
      setLanguage,
      toggleLanguage,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useSiteLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useSiteLanguage must be used within LanguageProvider");
  }

  return context;
}
