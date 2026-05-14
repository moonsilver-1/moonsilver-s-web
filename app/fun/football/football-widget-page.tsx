"use client";

import Link from "next/link";
import { useSiteLanguage } from "@/app/components/language-provider";

export function FootballWidgetPage() {
  const { language } = useSiteLanguage();

  const copy =
    language === "en"
      ? { label: "Football", backToFun: "Back to Fun" }
      : { label: "足球", backToFun: "返回娱乐页" };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300">
      <section className="mx-auto max-w-4xl px-6 py-24">
        <Link
          href="/fun"
          className="inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
        >
          {copy.backToFun}
        </Link>
        <h1 className="mt-10 text-5xl font-bold tracking-tight md:text-6xl">{copy.label}</h1>
      </section>
    </div>
  );
}
