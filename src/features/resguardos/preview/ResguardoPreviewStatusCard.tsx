"use client";

import styles from "@/features/resguardos/ResguardoPreview.module.css";

import type { SignatureRetryState, SubmissionStage } from "./types";

interface ResguardoPreviewStatusCardProps {
  submissionStage: SubmissionStage;
  statusMessage: string;
  signatureRetry: SignatureRetryState | null;
  confirmationPending: boolean;
  onRetrySignatureUpload: () => void;
}

export default function ResguardoPreviewStatusCard({
  submissionStage,
  statusMessage,
  signatureRetry,
  confirmationPending,
  onRetrySignatureUpload,
}: ResguardoPreviewStatusCardProps) {
  const statusToneClass =
    submissionStage === "success"
      ? styles.statusCardSuccess
      : submissionStage === "signature_error"
        ? styles.statusCardError
        : styles.statusCardInfo;

  return (
    <section className={`${styles.statusCard} ${statusToneClass}`}>
      <div className={styles.statusCopy}>
        <h3 className={styles.statusTitle}>
          {submissionStage === "saving_resguardo"
            ? "Guardando resguardo"
            : submissionStage === "uploading_firma"
              ? "Subiendo firma"
              : submissionStage === "success"
                ? "Resguardo generado"
                : "Firma pendiente"}
        </h3>
        <p className={styles.statusText}>{statusMessage}</p>
      </div>

      {signatureRetry ? (
        <div className={styles.statusActions}>
          <button
            type="button"
            className={styles.retryButton}
            onClick={onRetrySignatureUpload}
            disabled={confirmationPending}
          >
            {confirmationPending ? "Reintentando..." : "Reintentar firma"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
