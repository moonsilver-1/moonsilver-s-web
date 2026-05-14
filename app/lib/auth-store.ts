import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { getAdminUser, normalizeUsers, type AccountStatus, type StoredUser } from "@/app/lib/auth-data";
import { hashPassword, verifyPassword } from "@/app/lib/auth-password";

const AUTH_STORE_PATH = path.join(process.cwd(), "data", "accounts.json");

type DbUserRow = {
  username: string;
  password_hash: string;
  is_admin: boolean;
  status: AccountStatus;
  requested_at: Date | string | null;
  approved_at: Date | string | null;
};

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function sql() {
  return neon(getDatabaseUrl());
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToUser(row: DbUserRow): StoredUser {
  return {
    username: row.username,
    password: row.password_hash,
    isAdmin: row.is_admin,
    status: row.status,
    requestedAt: toIso(row.requested_at),
    approvedAt: toIso(row.approved_at),
  };
}

async function ensureDb() {
  const query = sql();
  await query`
    CREATE TABLE IF NOT EXISTS moon_users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMPTZ,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const admin = getAdminUser();
  if (!admin.password) return;

  const existing = (await query`
    SELECT username, password_hash, is_admin, status, requested_at, approved_at
    FROM moon_users
    WHERE username = ${admin.username}
    LIMIT 1
  `) as DbUserRow[];

  if (existing.length === 0) {
    await query`
      INSERT INTO moon_users (username, password_hash, is_admin, status, approved_at)
      VALUES (${admin.username}, ${hashPassword(admin.password)}, TRUE, 'approved', NOW())
    `;
    return;
  }

  const existingAdmin = existing[0];
  if (!existingAdmin.is_admin || existingAdmin.status !== "approved" || !verifyPassword(admin.password, existingAdmin.password_hash)) {
    await query`
      UPDATE moon_users
      SET password_hash = ${hashPassword(admin.password)}, is_admin = TRUE, status = 'approved', approved_at = NOW()
      WHERE username = ${admin.username}
    `;
  }
}

async function ensureStoreFile() {
  await mkdir(path.dirname(AUTH_STORE_PATH), { recursive: true });

  try {
    await readFile(AUTH_STORE_PATH, "utf8");
  } catch {
    await writeJsonAccounts([getAdminUser()]);
  }
}

async function readJsonAccounts(): Promise<StoredUser[]> {
  await ensureStoreFile();

  try {
    const raw = await readFile(AUTH_STORE_PATH, "utf8");
    return normalizeUsers(JSON.parse(raw) as unknown);
  } catch {
    const fallback = [getAdminUser()];
    await writeJsonAccounts(fallback);
    return fallback;
  }
}

async function writeJsonAccounts(users: StoredUser[]) {
  await mkdir(path.dirname(AUTH_STORE_PATH), { recursive: true });
  await writeFile(AUTH_STORE_PATH, JSON.stringify(normalizeUsers(users), null, 2), "utf8");
}

export async function readAccounts(): Promise<StoredUser[]> {
  if (!hasDatabase()) {
    return readJsonAccounts();
  }

  await ensureDb();
  const rows = (await sql()`
    SELECT username, password_hash, is_admin, status, requested_at, approved_at
    FROM moon_users
    ORDER BY is_admin DESC, created_at ASC
  `) as DbUserRow[];
  return rows.map(rowToUser);
}

export async function authenticateAccount(username: string, password: string): Promise<StoredUser | null> {
  const admin = getAdminUser();
  if (username === admin.username && admin.password && password === admin.password) {
    if (hasDatabase()) {
      await ensureDb();
    }
    return admin;
  }

  if (!hasDatabase()) {
    const users = await readJsonAccounts();
    return users.find((user) => user.username === username && user.status === "approved" && verifyPassword(password, user.password)) ?? null;
  }

  await ensureDb();
  const rows = (await sql()`
    SELECT username, password_hash, is_admin, status, requested_at, approved_at
    FROM moon_users
    WHERE username = ${username}
    LIMIT 1
  `) as DbUserRow[];
  const user = rows[0] ? rowToUser(rows[0]) : null;
  if (!user || user.status !== "approved" || !verifyPassword(password, user.password)) {
    return null;
  }
  return user;
}

export async function createPendingAccount(username: string, password: string): Promise<StoredUser> {
  const normalizedUsername = username.trim();

  if (!hasDatabase()) {
    const users = await readJsonAccounts();
    const exists = users.some((user) => user.username.toLowerCase() === normalizedUsername.toLowerCase());
    if (exists) throw new Error("USERNAME_TAKEN");

    const pendingUser: StoredUser = {
      username: normalizedUsername,
      password: hashPassword(password),
      isAdmin: false,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    await writeJsonAccounts([...users, pendingUser]);
    return pendingUser;
  }

  await ensureDb();
  try {
    const rows = (await sql()`
      INSERT INTO moon_users (username, password_hash, is_admin, status, requested_at)
      VALUES (${normalizedUsername}, ${hashPassword(password)}, FALSE, 'pending', NOW())
      RETURNING username, password_hash, is_admin, status, requested_at, approved_at
    `) as DbUserRow[];
    return rowToUser(rows[0]);
  } catch {
    throw new Error("USERNAME_TAKEN");
  }
}

export async function approveAccount(username: string): Promise<StoredUser | null> {
  if (!hasDatabase()) {
    const users = await readJsonAccounts();
    const index = users.findIndex((user) => user.username === username && !user.isAdmin);
    if (index === -1) return null;

    const approvedUser: StoredUser = {
      ...users[index],
      status: "approved",
      approvedAt: new Date().toISOString(),
    };

    const nextUsers = [...users];
    nextUsers[index] = approvedUser;
    await writeJsonAccounts(nextUsers);
    return approvedUser;
  }

  await ensureDb();
  const rows = (await sql()`
    UPDATE moon_users
    SET status = 'approved', approved_at = NOW()
    WHERE username = ${username} AND is_admin = FALSE
    RETURNING username, password_hash, is_admin, status, requested_at, approved_at
  `) as DbUserRow[];
  return rows[0] ? rowToUser(rows[0]) : null;
}
