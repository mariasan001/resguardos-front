"use client";

import { useSyncExternalStore } from "react";

import { readUpdatedUsersCache, subscribeUpdatedUsersCache } from "@/lib/utils/user-cache";

export function useUpdatedUsersCache() {
  return useSyncExternalStore(
    subscribeUpdatedUsersCache,
    readUpdatedUsersCache,
    () => ({}),
  );
}
