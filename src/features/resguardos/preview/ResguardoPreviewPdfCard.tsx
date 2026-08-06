"use client";

import { Download, Mail } from "lucide-react";
import type { RefObject } from "react";

import styles from "@/features/resguardos/ResguardoPreview.module.css";

import type { GeneratedPdfState } from "./types";

interface ResguardoPreviewPdfCardProps {
  pdfCardRef: RefObject<HTMLElement | null>;
  generatedPdf: GeneratedPdfState | null;
  pdfPreviewPending: boolean;
  pdfPreviewError: string | null;
  emailPending: boolean;
  onDownload: () => void;
  onSendEmail: () => void;
  onRetryPreview: () => void;
}

export default function ResguardoPreviewPdfCard({
  pdfCardRef,
  generatedPdf,
  pdfPreviewPending,
  pdfPreviewError,
  emailPending,
  onDownload,
  onSendEmail,
  onRetryPreview,
}: ResguardoPreviewPdfCardProps) {
  return (
    <section ref={pdfCardRef} className={styles.pdfCard}>
      <div className={styles.pdfHeader}>
        <div className={styles.pdfCopy}>
          <h3 className={styles.pdfTitle}>Vista previa del PDF</h3>
          <p className={styles.pdfText}>
            Revisa el formato generado del resguardo antes de descargarlo o enviarlo.
          </p>
        </div>

        <div className={styles.pdfActions}>
          <button
            type="button"
            className={styles.downloadPdfButton}
            onClick={onDownload}
            disabled={!generatedPdf || pdfPreviewPending}
          >
            <Download size={15} strokeWidth={1.9} />
            Descargar PDF
          </button>

          <button
            type="button"
            className={styles.primaryPdfButton}
            onClick={onSendEmail}
            disabled={!generatedPdf || pdfPreviewPending || emailPending}
          >
            <Mail size={15} strokeWidth={1.9} />
            {emailPending ? "Enviando..." : "Enviar por email"}
          </button>
        </div>
      </div>

      {pdfPreviewPending ? (
        <div className={styles.pdfState}>
          <p className={styles.pdfStateTitle}>Generando vista previa...</p>
          <p className={styles.pdfStateText}>
            Preparando el PDF del resguardo con la firma registrada.
          </p>
        </div>
      ) : generatedPdf ? (
        <div className={styles.pdfPreviewFrame}>
          <iframe
            className={styles.pdfPreview}
            title={`Vista previa del resguardo ${generatedPdf.resguardoId}`}
            src={generatedPdf.url}
          />
        </div>
      ) : (
        <div className={styles.pdfState}>
          <p className={styles.pdfStateTitle}>No se pudo mostrar el PDF</p>
          <p className={styles.pdfStateText}>
            {pdfPreviewError ?? "Vuelve a intentarlo para generar la vista previa."}
          </p>
          <div className={styles.pdfStateActions}>
            <button
              type="button"
              className={styles.retryButton}
              onClick={onRetryPreview}
              disabled={pdfPreviewPending}
            >
              Reintentar vista previa
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
