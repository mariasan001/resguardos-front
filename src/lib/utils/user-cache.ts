import type { AppUser } from "@/lib/types/api";

const USER_CACHE_STORAGE_KEY = "updatedUsuariosByNeyemp";
const USER_CACHE_CHANGE_EVENT = "updated-usuarios-change";

let cachedSerializedUsers: string | null | undefined;
let cachedUsers: Record<string, AppUser> = {};

function isUserRecord(value: unknown): value is Record<string, AppUser> {
  return typeof value === "object" && value !== null;
}

export function readUpdatedUsersCache() {
  if (typeof window === "undefined") {
    return {};
  }

  const serialized = window.localStorage.getItem(USER_CACHE_STORAGE_KEY);

  if (!serialized) {
    cachedSerializedUsers = null;
    cachedUsers = {};
    return {};
  }

  if (serialized === cachedSerializedUsers) {
    return cachedUsers;
  }

  try {
    const parsed = JSON.parse(serialized) as unknown;
    cachedUsers = isUserRecord(parsed) ? parsed : {};
    cachedSerializedUsers = serialized;
    return cachedUsers;
  } catch {
    cachedSerializedUsers = serialized;
    cachedUsers = {};
    return {};
  }
}

export function writeUpdatedUsersCache(users: Record<string, AppUser>) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(users);
  cachedSerializedUsers = serialized;
  cachedUsers = users;
  window.localStorage.setItem(USER_CACHE_STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(USER_CACHE_CHANGE_EVENT));
}

export function patchUpdatedUser(user: AppUser) {
  const neyemp = user.neyemp?.trim();

  if (!neyemp) {
    return;
  }

  const currentUsers = readUpdatedUsersCache();

  writeUpdatedUsersCache({
    ...currentUsers,
    [neyemp]: user,
  });
}

export function subscribeUpdatedUsersCache(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(USER_CACHE_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(USER_CACHE_CHANGE_EVENT, handleChange);
  };
}
