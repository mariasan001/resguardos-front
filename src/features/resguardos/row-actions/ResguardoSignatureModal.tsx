"use client";

import Image from "next/image";
import { CheckCircle2, Eraser, PenLine, Signature, X } from "lucide-react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";

import styles from "@/features/resguardos/ResguardoRowActions.module.css";

interface ResguardoSignatureModalProps {
  open: boolean;
  inventario?: string;
  loading: boolean;
  signatureDataUrl: string | null;
  signatureMessage: string | null;
  signatureStatusCode: number | null;
  signatureCaptureOpen: boolean;
  signatureCaptured: boolean;
  signatureUploadPending: boolean;
  signatureUploadError: string | null;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasWrapRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onOpenCapture: () => void;
  onClearCapture: () => void;
  onSaveSignature: () => void;
}

export default function ResguardoSignatureModal({
  open,
  inventario,
  loading,
  signatureDataUrl,
  signatureMessage,
  signatureStatusCode,
  signatureCaptureOpen,
  signatureCaptured,
  signatureUploadPending,
  signatureUploadError,
  canvasRef,
  canvasWrapRef,
  onClose,
  onOpenCapture,
  onClearCapture,
  onSaveSignature,
}: ResguardoSignatureModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="firma-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <h3 id="firma-modal-title" className={styles.modalTitle}>
              Firma del resguardo
            </h3>
            <p className={styles.modalDescription}>
              {inventario?.trim() || "Resguardo seleccionado"}
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            aria-label="Cerrar firma"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {loading ? (
          <div className={styles.emptySignature}>
            <div className={styles.emptySignatureInner}>
              <Signature size={18} strokeWidth={1.8} />
              <p>Cargando firma...</p>
            </div>
          </div>
        ) : signatureDataUrl ? (
          <div className={styles.signatureFrame}>
            <Image
              className={styles.signatureImage}
              src={signatureDataUrl}
              alt="Firma del titular"
              width={640}
              height={220}
              unoptimized
            />
          </div>
        ) : signatureCaptureOpen ? (
          <div className={styles.captureBlock}>
            <div className={styles.captureCopy}>
              <p className={styles.captureTitle}>Capturar firma</p>
              <p className={styles.captureText}>
                Firma dentro del recuadro y guarda la firma en este mismo resguardo.
              </p>
            </div>

            <div className={styles.captureCanvasWrap} ref={canvasWrapRef}>
              {!signatureCaptured ? (
                <div className={styles.capturePlaceholder}>
                  <PenLine size={18} strokeWidth={1.9} />
                  Firma dentro del recuadro
                </div>
              ) : null}
              <canvas ref={canvasRef} className={styles.captureCanvas} />
            </div>

            {signatureUploadError ? (
              <p className={styles.captureError}>{signatureUploadError}</p>
            ) : null}

            <div className={styles.captureActions}>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={onClearCapture}
                disabled={signatureUploadPending}
              >
                <Eraser size={15} strokeWidth={1.9} />
                Limpiar
              </button>

              <button
                type="button"
                className={styles.primaryAction}
                onClick={onSaveSignature}
                disabled={signatureUploadPending}
              >
                {signatureUploadPending ? "Guardando firma..." : "Guardar firma"}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.emptySignature}>
            <div className={styles.emptySignatureInner}>
              <Signature size={18} strokeWidth={1.8} />
              <p>{signatureMessage ?? "No hay firma disponible para este resguardo."}</p>
              {signatureStatusCode === 404 || signatureStatusCode === 410 ? (
                <>
                  <p className={styles.emptySignatureText}>
                    Puedes capturarla y guardarla ahora sin generar un nuevo resguardo.
                  </p>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={onOpenCapture}
                  >
                    <CheckCircle2 size={15} strokeWidth={1.9} />
                    Capturar firma
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
