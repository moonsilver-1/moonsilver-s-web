export type SiteLanguage = "zh" | "en";

export const DEFAULT_LANGUAGE: SiteLanguage = "zh";

export function normalizeSiteLanguage(value: string | null | undefined): SiteLanguage {
  return value === "en" ? "en" : "zh";
}

export function htmlLang(language: SiteLanguage) {
  return language === "en" ? "en" : "zh-CN";
}
