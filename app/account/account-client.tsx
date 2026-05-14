"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/auth-provider";
import { useSiteLanguage } from "@/app/components/language-provider";
import type { AuthUser } from "@/app/lib/auth-data";

type AccountMode = "dashboard" | "login" | "register";
type MessageTone = "success" | "error" | "info";
type Message = { tone: MessageTone; text: string } | null;

const copy = {
  zh: {
    eyebrow: "Account",
    dashboardTitle: "账号中心",
    loginTitle: "登录",
    registerTitle: "申请注册",
    dashboardIntro: "查看登录状态，管理员可以审批新账号。",
    loginIntro: "使用已审核通过的账号登录。",
    registerIntro: "提交申请后，需要管理员审核通过才能登录。",
    username: "用户名",
    password: "密码",
    usernameHint: "3-24 位字母、数字、下划线或短横线",
    passwordHint: "至少 6 个字符",
    login: "登录",
    register: "提交申请",
    logout: "退出登录",
    adminPanel: "管理员审批",
    adminPanelIntro: "审核通过后，用户即可登录并参与排行榜。",
    pending: "待审批",
    approved: "已通过用户",
    noPending: "暂无待审批申请。",
    noApproved: "暂无普通用户。",
    approve: "通过",
    refresh: "刷新",
    status: "当前状态",
    signedIn: (name: string, admin: boolean) => `已登录：${name}${admin ? "（管理员）" : ""}`,
    signedOut: "当前未登录。",
    goLogin: "去登录",
    goRegister: "申请账号",
    goDashboard: "账号中心",
    loginSuccess: "登录成功。",
    registerSuccess: "申请已提交，请等待管理员审核。",
    approveSuccess: (name: string) => `已通过 ${name}。`,
  },
  en: {
    eyebrow: "Account",
    dashboardTitle: "Account Center",
    loginTitle: "Sign In",
    registerTitle: "Request Access",
    dashboardIntro: "Check your session. Admins can approve new accounts.",
    loginIntro: "Sign in with an approved account.",
    registerIntro: "Submit a request. An admin must approve it before you can sign in.",
    username: "Username",
    password: "Password",
    usernameHint: "3-24 letters, numbers, underscores, or hyphens",
    passwordHint: "At least 6 characters",
    login: "Sign in",
    register: "Submit request",
    logout: "Sign out",
    adminPanel: "Admin Approval",
    adminPanelIntro: "After approval, members can sign in and join leaderboards.",
    pending: "Pending",
    approved: "Approved Members",
    noPending: "No pending requests.",
    noApproved: "No members yet.",
    approve: "Approve",
    refresh: "Refresh",
    status: "Current Status",
    signedIn: (name: string, admin: boolean) => `Signed in as ${name}${admin ? " (admin)" : ""}.`,
    signedOut: "Not signed in.",
    goLogin: "Sign in",
    goRegister: "Request access",
    goDashboard: "Account center",
    loginSuccess: "Signed in.",
    registerSuccess: "Registration request submitted. Wait for admin approval.",
    approveSuccess: (name: string) => `${name} approved.`,
  },
} as const;

function messageClass(tone: MessageTone) {
  if (tone === "success") return "border-emerald-500/25 text-emerald-700 dark:text-emerald-200";
  if (tone === "error") return "border-rose-500/25 text-rose-700 dark:text-rose-200";
  return "border-[var(--app-border)] text-[var(--app-muted)]";
}

async function readJson(response: Response) {
  return (await response.json().catch(() => null)) as { error?: string; users?: AuthUser[] } | null;
}

export function AccountClient({ mode = "dashboard" }: { mode?: AccountMode }) {
  const { user, login, logout } = useAuth();
  const { language } = useSiteLanguage();
  const labels = copy[language];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPurgingRooms, setIsPurgingRooms] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [mahjongRooms, setMahjongRooms] = useState<number | null>(null);
  const [mahjongActiveRooms, setMahjongActiveRooms] = useState<number | null>(null);

  const pendingUsers = users.filter((item) => item.status === "pending");
  const pendingCount = pendingUsers.length;
  const approvedUsers = users.filter((item) => item.status === "approved" && !item.isAdmin);
  const title = mode === "login" ? labels.loginTitle : mode === "register" ? labels.registerTitle : labels.dashboardTitle;
  const intro = mode === "login" ? labels.loginIntro : mode === "register" ? labels.registerIntro : labels.dashboardIntro;

  async function loadUsers() {
    if (!user?.isAdmin) return;

    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/auth?admin=users");
      const data = await readJson(response);
      if (response.ok && data?.users) {
        setUsers(data.users);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [user?.isAdmin]);

  useEffect(() => {
    if (!user?.isAdmin) {
      return;
    }

    const refresh = () => {
      void loadUsers();
    };

    const interval = window.setInterval(refresh, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.isAdmin]);

  async function handleLogin() {
    setIsSubmitting(true);
    setMessage(null);
    const result = await login(username, password);
    setMessage(result.ok ? { tone: "success", text: labels.loginSuccess } : { tone: "error", text: result.error || "Login failed." });
    setIsSubmitting(false);
  }

  async function handleRegister() {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", username, password }),
    });
    const data = await readJson(response);

    if (response.ok) {
      setUsername("");
      setPassword("");
      setMessage({ tone: "success", text: labels.registerSuccess });
      await loadUsers();
    } else {
      setMessage({ tone: "error", text: data?.error || "Registration failed." });
    }

    setIsSubmitting(false);
  }

  async function handleApprove(name: string) {
    setIsSubmitting(true);
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", username: name }),
    });
    const data = await readJson(response);

    setMessage(response.ok ? { tone: "success", text: labels.approveSuccess(name) } : { tone: "error", text: data?.error || "Approval failed." });
    await loadUsers();
    setIsSubmitting(false);
  }

  async function loadMahjongRooms() {
    if (!user?.isAdmin) return;

    const response = await fetch("/api/mahjong");
    const data = (await response.json().catch(() => null)) as { rooms?: number; activeRooms?: number } | null;
    if (response.ok && typeof data?.rooms === "number") {
      setMahjongRooms(data.rooms);
    }
    if (response.ok && typeof data?.activeRooms === "number") {
      setMahjongActiveRooms(data.activeRooms);
    }
  }

  async function handlePurgeMahjongRooms() {
    if (!user?.isAdmin) return;

    const active = mahjongActiveRooms ?? 0;
    const total = mahjongRooms ?? 0;
    const confirmed = window.confirm(`确认清空所有麻将房间吗？\n当前共有 ${total} 个房间，其中 ${active} 个正在进行中。\n这会删除等待中、进行中和残局的全部房间。`);
    if (!confirmed) return;

    setIsPurgingRooms(true);
    setMessage(null);
    const response = await fetch("/api/mahjong", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "purgeAll" }),
    });
    const data = (await response.json().catch(() => null)) as { ok?: boolean; deleted?: number; error?: string } | null;
    if (response.ok && data?.ok) {
      setMessage({ tone: "success", text: `已清空 ${data.deleted ?? 0} 个麻将房间。` });
      await loadMahjongRooms();
    } else {
      setMessage({ tone: "error", text: data?.error || "清空麻将房间失败。" });
    }
    setIsPurgingRooms(false);
  }

  useEffect(() => {
    if (!user?.isAdmin) {
      setMahjongRooms(null);
      setMahjongActiveRooms(null);
      return;
    }

    void loadMahjongRooms();
  }, [user?.isAdmin]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-24 text-[var(--app-fg)] transition-colors duration-300">
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{labels.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--app-muted)]">{intro}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]" href="/account/login">
            {labels.goLogin}
          </Link>
          <Link className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]" href="/account/register">
            {labels.goRegister}
          </Link>
          <Link className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]" href="/account">
            {labels.goDashboard}
          </Link>
        </div>

        {mode !== "dashboard" ? (
          <div className="mt-10 max-w-md rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-5">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">{labels.username}</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--app-border-strong)]"
                  placeholder={mode === "register" ? labels.usernameHint : labels.username}
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">{labels.password}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--app-border-strong)]"
                  placeholder={mode === "register" ? labels.passwordHint : labels.password}
                />
              </label>
              <button
                type="button"
                onClick={mode === "login" ? handleLogin : handleRegister}
                disabled={isSubmitting}
                className="w-full rounded-full bg-[var(--app-fg)] px-5 py-3 text-sm font-medium text-[var(--app-bg)] hover:opacity-90 disabled:opacity-60"
              >
                {mode === "login" ? labels.login : labels.register}
              </button>
            </div>
          </div>
        ) : null}

        <section className="mt-8 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">{labels.status}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
            {user ? labels.signedIn(user.username, user.isAdmin) : labels.signedOut}
          </p>
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="mt-4 rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
            >
              {labels.logout}
            </button>
          ) : null}
        </section>

        {message ? <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${messageClass(message.tone)}`}>{message.text}</p> : null}

        {user?.isAdmin ? (
          <section className="mt-8 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{labels.adminPanel}</h2>
                <p className="mt-2 text-sm text-[var(--app-muted)]">{labels.adminPanelIntro}</p>
              </div>
              <div className="flex items-center gap-3">
                {pendingCount > 0 ? (
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-200">
                    {pendingCount}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={isLoadingUsers}
                  className="rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] disabled:opacity-60"
                >
                  {labels.refresh}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-bg)]/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">麻将房间管理</h3>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    当前房间数：{mahjongRooms ?? "?"}，进行中：{mahjongActiveRooms ?? "?"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePurgeMahjongRooms}
                  disabled={isPurgingRooms}
                  className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-500/15 disabled:opacity-60 dark:text-rose-200"
                >
                  {isPurgingRooms ? "清空中..." : "清空麻将房间"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">{labels.pending}</p>
                <div className="mt-3 space-y-2">
                  {pendingUsers.length > 0 ? (
                    pendingUsers.map((item) => (
                      <div key={item.username} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] px-4 py-3">
                        <span className="text-sm font-medium">{item.username}</span>
                        <button
                          type="button"
                          onClick={() => handleApprove(item.username)}
                          disabled={isSubmitting}
                          className="rounded-full bg-[var(--app-fg)] px-4 py-2 text-xs font-medium text-[var(--app-bg)] hover:opacity-90 disabled:opacity-60"
                        >
                          {labels.approve}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-[var(--app-border)] px-4 py-3 text-sm text-[var(--app-muted)]">{labels.noPending}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">{labels.approved}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {approvedUsers.length > 0 ? (
                    approvedUsers.map((item) => (
                      <span key={item.username} className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs text-[var(--app-muted)]">
                        {item.username}
                      </span>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-[var(--app-border)] px-4 py-3 text-sm text-[var(--app-muted)]">{labels.noApproved}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}
