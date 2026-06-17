"use client";

import { useEffect, useRef } from "react";

import type { ActionResult } from "@/lib/types/api";
import { notify } from "@/lib/utils/notify";

interface UseActionToastOptions {
  successTitle?: string;
  errorTitle?: string;
}

export default function useActionToast(
  state: ActionResult,
  options?: UseActionToastOptions,
) {
  const lastStateRef = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state.message || state === lastStateRef.current) {
      return;
    }

    lastStateRef.current = state;

    if (state.success) {
      notify.success(options?.successTitle ?? "Operación completada", state.message);
      return;
    }

    notify.error(options?.errorTitle ?? "No fue posible completar la operación", state.message);
  }, [options?.errorTitle, options?.successTitle, state]);
}
