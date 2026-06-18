"use client";

import { useSyncExternalStore } from "react";

import type { PreviewResguardoDraft } from "@/lib/types/api";
import {
  readPreviewResguardoDraft,
  subscribePreviewResguardoDraft,
} from "@/lib/utils/resguardo-draft";

function subscribeHydration() {
  return () => undefined;
}

export function useIsHydrated() {
  return useSyncExternalStore(subscribeHydration, () => true, () => false);
}

export function usePreviewResguardoDraft(): PreviewResguardoDraft | null {
  return useSyncExternalStore(
    subscribePreviewResguardoDraft,
    readPreviewResguardoDraft,
    () => null,
  );
}
