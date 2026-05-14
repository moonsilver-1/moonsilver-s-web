"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { AuthUser } from "@/app/lib/auth-data";

type AuthContextValue = {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const CURRENT_KEY = "moon-auth-current";
const AuthContext = createContext<AuthContextValue | null>(null);

function readCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.username || parsed.status !== "approved") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readCurrentUser());

  const value = useMemo<AuthContextValue>(() => {
    function persistCurrent(nextUser: AuthUser | null) {
      setUser(nextUser);
      if (typeof window === "undefined") {
        return;
      }

      if (nextUser) {
        window.localStorage.setItem(CURRENT_KEY, JSON.stringify(nextUser));
      } else {
        window.localStorage.removeItem(CURRENT_KEY);
      }
    }

    async function submitLogin(username: string, password: string) {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        user?: AuthUser;
        error?: string;
      } | null;

      if (!response.ok || !data?.user) {
        return { user: null, error: data?.error || "Login failed." };
      }

      return { user: data.user };
    }

    return {
      user,
      async login(username, password) {
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUsername || !trimmedPassword) {
          return { ok: false, error: "Username and password are required." };
        }

        const result = await submitLogin(trimmedUsername, trimmedPassword);
        if (!result.user) {
          return { ok: false, error: result.error };
        }

        persistCurrent(result.user);
        return { ok: true };
      },
      logout() {
        void fetch("/api/auth", { method: "DELETE" });
        persistCurrent(null);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
