"use client";

import Link from "next/link";
import SignaturePad from "signature_pad";
import {
  CheckCircle2,
  Eraser,
  FileCheck2,
  Mail,
  PenLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { notify } from "@/lib/utils/notify";
import { trimSignatureDataUrl } from "@/lib/utils/signature";
import styles from "@/features/resguardos/ResguardoVerificationCard.module.css";

interface ResguardoVerificationCardProps {
  titular: string;
  titularEmail?: string;
  initialSignatureDataUrl?: string;
  initialSignatureValidated?: boolean;
  confirmationPending?: boolean;
  readOnly?: boolean;
  signatureLocked?: boolean;
  signatureChoice?: ReactNode;
  backHref?: string;
  onTitularEmailChange?: (email: string) => void;
  onSignatureValidated?: (signatureDataUrl: string) => void;
  onReceptionConfirmed?: () => Promise<void> | void;
}

export default function ResguardoVerificationCard({
  titular,
  titularEmail = "",
  initialSignatureDataUrl,
  initialSignatureValidated = false,
  confirmationPending = false,
  readOnly = false,
  signatureLocked = false,
  signatureChoice,
  backHref = "/resguardos/nuevo",
  onTitularEmailChange,
  onSignatureValidated,
  onReceptionConfirmed,
}: ResguardoVerificationCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [trimmedSignatureState, setTrimmedSignatureState] = useState<{
    source: string;
    trimmed: string;
  } | null>(null);
  const [draftSigned, setDraftSigned] = useState(Boolean(initialSignatureDataUrl));
  const [draftValidated, setDraftValidated] = useState(initialSignatureValidated);
  const [accepted, setAccepted] = useState(false);
  const hasStoredSignature = Boolean(initialSignatureDataUrl);
  const displaySignatureDataUrl =
    (readOnly || signatureLocked) &&
    initialSignatureDataUrl &&
    trimmedSignatureState?.source === initialSignatureDataUrl
      ? trimmedSignatureState.trimmed
      : initialSignatureDataUrl;
  const isSigned = readOnly || signatureLocked ? hasStoredSignature : draftSigned;
  const isSignatureValidated = readOnly || signatureLocked
    ? hasStoredSignature || initialSignatureValidated
    : draftValidated;
  const canConfirmReception = accepted && isSignatureValidated;

  useEffect(() => {
    let cancelled = false;

    if (!initialSignatureDataUrl || (!readOnly && !signatureLocked)) {
      return () => {
        cancelled = true;
      };
    }

    void trimSignatureDataUrl(initialSignatureDataUrl).then((trimmedDataUrl) => {
      if (!cancelled) {
        setTrimmedSignatureState({
          source: initialSignatureDataUrl,
          trimmed: trimmedDataUrl,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialSignatureDataUrl, readOnly, signatureLocked]);

  useEffect(() => {
    if (readOnly || signatureLocked) {
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    // signature_pad calcula el grosor como maxWidth / (velocidad + 1): al firmar con
    // mouse la velocidad es alta, asi que el trazo se va al minimo. Un minWidth mayor
    // mantiene la tinta solida y un velocityFilterWeight bajo suaviza los cambios de
    // grosor para que las curvas no salgan con picos.
    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "rgba(255,255,255,0)",
      penColor: "#0f172a",
      minWidth: 1.15,
      maxWidth: 2.6,
      dotSize: 1.8,
      // Sin throttle se capturan todos los puntos del gesto; minDistance descarta el
      // ruido del puntero sin perder el detalle de la firma.
      throttle: 0,
      minDistance: 2.5,
      velocityFilterWeight: 0.35,
    });

    signaturePadRef.current = signaturePad;

    const handleBeginStroke = () => {
      setDraftValidated(false);
    };

    const handleEndStroke = () => {
      setDraftSigned(!signaturePad.isEmpty());
    };

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = container.getBoundingClientRect();
      const canvasHeight = window.matchMedia("(max-width: 48rem)").matches ? 190 : 230;
      const existingData = signaturePad.toData();

      if (!rect.width) {
        return;
      }

      canvas.width = rect.width * ratio;
      canvas.height = canvasHeight * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${canvasHeight}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.scale(ratio, ratio);

      if (existingData.length) {
        signaturePad.fromData(existingData);
      } else {
        signaturePad.clear();
      }
    };

    signaturePad.addEventListener("beginStroke", handleBeginStroke);
    signaturePad.addEventListener("endStroke", handleEndStroke);
    window.addEventListener("resize", resizeCanvas);

    // El ancho del recuadro cambia con el layout, no solo con la ventana.
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(container);
    resizeCanvas();

    if (initialSignatureDataUrl) {
      signaturePad.fromDataURL(initialSignatureDataUrl).catch(() => undefined);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      signaturePad.removeEventListener("beginStroke", handleBeginStroke);
      signaturePad.removeEventListener("endStroke", handleEndStroke);
      signaturePad.off();
      signaturePadRef.current = null;
    };
  }, [initialSignatureDataUrl, readOnly, signatureLocked]);

  function clearSignature() {
    const signaturePad = signaturePadRef.current;

    if (!signaturePad) {
      return;
    }

    signaturePad.clear();
    setDraftSigned(false);
    setDraftValidated(false);
  }

  function confirmSignature() {
    const signaturePad = signaturePadRef.current;

    if (!isSigned || !signaturePad || signaturePad.isEmpty()) {
      notify.warning(
        "Falta la firma",
        "Solicita la firma del titular antes de validar la recepcion.",
      );
      return;
    }

    const signatureDataUrl = signaturePad.toDataURL("image/png");
    setDraftValidated(true);
    onSignatureValidated?.(signatureDataUrl);
    notify.success("Firma validada", `La firma del titular para ${titular} fue validada.`);
  }

  async function confirmReception() {
    if (!canConfirmReception || confirmationPending) {
      return;
    }

    await onReceptionConfirmed?.();
  }

  const signatureStatus = isSignatureValidated
    ? readOnly || signatureLocked
      ? "Firma registrada"
      : "Validado"
    : isSigned
      ? "Firma capturada"
      : "Pendiente";

  const signatureTone = isSignatureValidated
    ? "success"
    : isSigned
      ? "info"
      : "neutral";
  const hasSignatureOnPaper = readOnly ? Boolean(displaySignatureDataUrl) : isSigned;

  return (
    <section className={styles.card} data-tone={signatureTone}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <span className={styles.iconWrap}>
            <FileCheck2 size={18} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className={styles.title}>Validacion y firma de recepcion</h2>
            <p className={styles.description}>
              Revisa los datos del resguardo y recaba la firma del titular.
            </p>
          </div>
        </div>

        <span className={styles.readyBadge} data-tone={signatureTone}>
          {isSignatureValidated ? (
            <CheckCircle2 size={14} strokeWidth={2} />
          ) : (
            <span className={styles.badgeDot} />
          )}
          {signatureStatus}
        </span>
      </div>

      <div className={styles.signatureBlock}>
        <div className={styles.signatureHead}>
          <div className={styles.signatureCopy}>
            <p className={styles.signatureLabel}>Firma del titular</p>
            <p className={styles.signatureHint}>
              {readOnly || signatureLocked
                ? "Consulta la firma registrada para este resguardo."
                : "Firma aqui para dejar constancia de recepcion."}
            </p>
          </div>

          {signatureChoice}
        </div>

        <div className={styles.paper} data-tone={signatureTone}>
          <div className={styles.canvasWrap} ref={containerRef}>
            {(readOnly || signatureLocked) && displaySignatureDataUrl ? (
              <div className={styles.signaturePreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displaySignatureDataUrl}
                  alt="Firma del titular"
                  className={styles.signaturePreviewImage}
                />
              </div>
            ) : !isSigned ? (
              <div className={styles.canvasPlaceholder}>
                <span className={styles.placeholderIcon}>
                  <PenLine size={16} strokeWidth={1.9} />
                </span>
                {readOnly ? "No hay firma disponible" : "Firma dentro del recuadro"}
              </div>
            ) : null}
            {readOnly || signatureLocked ? null : (
              <canvas ref={canvasRef} className={styles.canvas} />
            )}

            <div className={styles.baseline} aria-hidden="true">
              <span className={styles.baselineMark}>×</span>
              <span className={styles.baselineRule} />
            </div>
          </div>

          <div className={styles.paperFoot}>
            <span className={styles.paperName}>{titular}</span>
            <span className={styles.paperCaption}>
              Nombre y firma de quien recibe el equipo
            </span>
          </div>

          {isSignatureValidated && hasSignatureOnPaper ? (
            <span className={styles.paperSeal}>
              <ShieldCheck size={13} strokeWidth={2} />
              Verificada
            </span>
          ) : null}
        </div>

        {readOnly || signatureLocked ? null : (
          <div className={styles.signatureActionRow}>
            <div className={styles.signatureActions}>
              <button
                type="button"
                className={styles.clearButton}
                onClick={clearSignature}
                disabled={confirmationPending}
              >
                <Eraser size={15} strokeWidth={1.9} />
                Limpiar firma
              </button>

              <button
                type="button"
                className={styles.validateButton}
                onClick={confirmSignature}
                disabled={confirmationPending}
              >
                Confirmar firma
              </button>
            </div>

            <span className={styles.signatureStatus} data-tone={signatureTone}>
              {signatureStatus}
            </span>
          </div>
        )}

        <div className={styles.signatureMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>
              <UserRound size={15} strokeWidth={1.9} />
            </span>
            <div className={styles.metaCopy}>
              <span className={styles.metaLabel}>Titular</span>
              <strong className={styles.metaValue}>{titular}</strong>
            </div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon}>
              <Mail size={15} strokeWidth={1.9} />
            </span>
            <div className={styles.metaCopy}>
              <span className={styles.metaLabel}>Correo del titular</span>
              {readOnly ? (
                <strong className={styles.metaValue}>{titularEmail.trim() || "—"}</strong>
              ) : (
                <input
                  className={styles.metaInput}
                  type="email"
                  value={titularEmail}
                  placeholder="correo@institucion.gob.mx"
                  disabled={confirmationPending}
                  onChange={(event) => onTitularEmailChange?.(event.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {readOnly ? null : (
        <>
          <label
            className={`${styles.checkRow} ${confirmationPending ? styles.checkRowDisabled : ""}`}
          >
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={accepted}
              disabled={confirmationPending}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>
              Confirmo que el equipo, sus datos y accesorios corresponden con la entrega
              recibida por el titular.
            </span>
          </label>

          {!canConfirmReception ? (
            <p className={styles.validationHint}>
              Captura la firma y confirma la recepcion para continuar.
            </p>
          ) : null}

          <div className={styles.actions}>
            <Link
              href={backHref}
              className={`${styles.backButton} ${confirmationPending ? styles.actionDisabled : ""}`}
              aria-disabled={confirmationPending}
              onClick={(event) => {
                if (confirmationPending) {
                  event.preventDefault();
                }
              }}
            >
              Volver a revision
            </Link>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={confirmReception}
              disabled={!canConfirmReception || confirmationPending}
            >
              <ShieldCheck size={16} strokeWidth={1.9} />
              {confirmationPending ? "Guardando..." : "Confirmar recepcion"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
