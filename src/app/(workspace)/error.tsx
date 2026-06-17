"use client";

import { useEffect } from "react";

import FeedbackMessage from "@/components/ui/FeedbackMessage";
import Panel from "@/components/ui/Panel";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Panel
      title="No pudimos cargar esta seccion"
      description="Ocurrio un problema al obtener la informacion."
    >
      <FeedbackMessage tone="error" message={error.message} />
      <button
        type="button"
        onClick={reset}
        style={{
          width: "fit-content",
          minHeight: "2.875rem",
          padding: "0 1.25rem",
          borderRadius: "999px",
          border: "0",
          background: "var(--color-button-700)",
          color: "var(--color-white)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Reintentar
      </button>
    </Panel>
  );
}
