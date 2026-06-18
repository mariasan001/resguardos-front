"use client";

import FeedbackMessage from "@/components/ui/FeedbackMessage";
import Panel from "@/components/ui/Panel";
import styles from "@/app/(workspace)/error.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Panel
      title="No pudimos cargar esta seccion"
      description="Ocurrio un problema al obtener la informacion."
    >
      <FeedbackMessage tone="error" message={error.message} />
      <button
        type="button"
        onClick={reset}
        className={styles.retryButton}
      >
        Reintentar
      </button>
    </Panel>
  );
}
