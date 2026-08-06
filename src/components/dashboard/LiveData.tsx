"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface LiveDataProps {
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 30_000;

/**
 * Refresca los datos del servidor en segundo plano, sin interfaz propia.
 * La recarga se pausa mientras la pestana esta oculta.
 */
export default function LiveData({
  intervalMs = DEFAULT_INTERVAL_MS,
}: LiveDataProps) {
  const router = useRouter();

  useEffect(() => {
    function refreshWhenVisible() {
      if (!document.hidden) {
        router.refresh();
      }
    }

    const interval = window.setInterval(refreshWhenVisible, intervalMs);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [intervalMs, router]);

  return null;
}
