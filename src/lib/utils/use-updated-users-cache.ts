"use client";

import { useSyncExternalStore } from "react";

import { readUpdatedUsersCache, subscribeUpdatedUsersCache } from "@/lib/utils/user-cache";

const EMPTY_UPDATED_USERS_CACHE = {};

export function useUpdatedUsersCache() {
  return useSyncExternalStore(
    subscribeUpdatedUsersCache,
    readUpdatedUsersCache,
    () => EMPTY_UPDATED_USERS_CACHE,
  );
}
