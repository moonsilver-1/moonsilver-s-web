export type AccountStatus = "pending" | "approved";

export type StoredUser = {
  username: string;
  password: string;
  isAdmin: boolean;
  status: AccountStatus;
  requestedAt?: string;
  approvedAt?: string;
};

export type AuthUser = {
  username: string;
  isAdmin: boolean;
  status: AccountStatus;
};

export function getAdminUser(): StoredUser {
  return {
    username: process.env.ADMIN_USERNAME || "moonsilver-1",
    password: process.env.ADMIN_PASSWORD || "",
    isAdmin: true,
    status: "approved",
    approvedAt: new Date(0).toISOString(),
  };
}

function normalizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function normalizeStatus(value: unknown): AccountStatus {
  return value === "pending" ? "pending" : "approved";
}

export function normalizeUsers(value: unknown): StoredUser[] {
  const adminUser = getAdminUser();

  if (!Array.isArray(value)) {
    return [adminUser];
  }

  const users = value
    .map((item): StoredUser | null => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const username = typeof record.username === "string" ? record.username.trim() : "";
      const password = typeof record.password === "string" ? record.password : "";
      const isAdmin = normalizeBoolean(record.isAdmin);
      const status = isAdmin ? "approved" : normalizeStatus(record.status);
      const requestedAt = typeof record.requestedAt === "string" ? record.requestedAt : undefined;
      const approvedAt = typeof record.approvedAt === "string" ? record.approvedAt : undefined;

      if (!username || !password) {
        return null;
      }

      return {
        username,
        password,
        isAdmin,
        status,
        requestedAt,
        approvedAt,
      } satisfies StoredUser;
    })
    .filter((user): user is StoredUser => Boolean(user));

  const nonAdminUsers = users.filter((user) => user.username !== adminUser.username);
  const normalized = [adminUser, ...nonAdminUsers];

  return normalized.length > 0 ? normalized : [adminUser];
}

export function toAuthUser(user: StoredUser): AuthUser {
  return {
    username: user.username,
    isAdmin: user.isAdmin,
    status: user.status,
  };
}
