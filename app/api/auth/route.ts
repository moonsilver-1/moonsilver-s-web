import { NextResponse } from "next/server";
import { toAuthUser } from "@/app/lib/auth-data";
import { getCurrentAuthUser } from "@/app/lib/auth-current";
import { AUTH_COOKIE_NAME, signAuthSession } from "@/app/lib/auth-token";
import { approveAccount, authenticateAccount, createPendingAccount, readAccounts } from "@/app/lib/auth-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActionBody = {
  action?: unknown;
  username?: unknown;
  password?: unknown;
};

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: Request) {
  const currentUser = await getCurrentAuthUser();
  const { searchParams } = new URL(request.url);

  if (searchParams.get("admin") === "users") {
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const users = await readAccounts();
    return NextResponse.json({ users: users.map(toAuthUser) });
  }

  return NextResponse.json({ user: currentUser });
}

async function handleLogin(body: ActionBody) {
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const matched = await authenticateAccount(username, password);

  if (!matched) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ user: toAuthUser(matched) });
  setSessionCookie(response, signAuthSession(matched));
  return response;
}

async function handleRegister(body: ActionBody) {
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";

  if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
    return NextResponse.json({ error: "Username must be 3-24 letters, numbers, underscores, or hyphens." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const user = await createPendingAccount(username, password);
    return NextResponse.json({ user: toAuthUser(user), message: "Registration request submitted." }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_TAKEN") {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Registration is unavailable right now." }, { status: 500 });
  }
}

async function handleApprove(body: ActionBody) {
  const currentUser = await getCurrentAuthUser();
  if (!currentUser?.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  const approved = await approveAccount(username);
  if (!approved) {
    return NextResponse.json({ error: "Account request not found." }, { status: 404 });
  }

  return NextResponse.json({ user: toAuthUser(approved) });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ActionBody | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "login";

  if (action === "register") {
    return handleRegister(body);
  }

  if (action === "approve") {
    return handleApprove(body);
  }

  return handleLogin(body);
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
