import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  description: "Account login has been removed.",
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-24 text-[var(--app-fg)] transition-colors duration-300">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">Account</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">登录功能已移除</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
          现在网站不再提供账号登录、注册和审批入口。需要区分玩家时，请直接在麻将房间里设置昵称。
        </p>
        <Link
          href="/fun/mahjong"
          className="mt-8 inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
        >
          去麻将房间
        </Link>
      </section>
    </div>
  );
}
