"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Download,
  Eraser,
  Eye,
  Mail,
  MoreHorizontal,
  PenLine,
  Signature,
  X,
} from "lucide-react";
import SignaturePad from "signature_pad";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import styles from "@/features/resguardos/ResguardoRowActions.module.css";
import { ApiError, getApiErrorMessage } from "@/lib/api/errors";
import { sendResguardoEmailWithPdf } from "@/lib/services/email.service";
import {
  getResguardoById,
  getResguardoFirma,
  uploadResguardoFirma,
} from "@/lib/services/resguardos.service";
import { generateResguardoPdf } from "@/lib/services/resguardo-pdf.service";
import { blobToDataUrl, dataUrlToFile } from "@/lib/utils/file";
import { notify } from "@/lib/utils/notify";
import { mapResguardoToPreviewDraft } from "@/lib/utils/resguardo-payload";

interface ResguardoRowActionsProps {
  id?: number;
  inventario?: string;
}

export default function ResguardoRowActions({
  id,
  inventario,
}: ResguardoRowActionsProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [open, setOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signatureCaptureOpen, setSignatureCaptureOpen] = useState(false);
  const [signatureCaptured, setSignatureCaptured] = useState(false);
  const [signatureUploadPending, setSignatureUploadPending] = useState(false);
  const [signatureUploadError, setSignatureUploadError] = useState<string | null>(null);
  const [signatureStatusCode, setSignatureStatusCode] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const hasValidId = typeof id === "number" && Number.isFinite(id);

  useEffect(() => {
    const closeMenu = () => setOpen(false);

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !wrapperRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setSignatureOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 12;

    let left = triggerRect.right - menuRect.width;
    let top = triggerRect.bottom + gap;

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (left + menuRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - menuRect.width - viewportPadding;
    }

    if (top + menuRect.height > window.innerHeight - viewportPadding) {
      top = triggerRect.top - menuRect.height - gap;
    }

    if (top < viewportPadding) {
      top = viewportPadding;
    }

    setMenuPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!signatureOpen || !signatureCaptureOpen) {
      return;
    }

    const canvas = canvasRef.current;
    const container = canvasWrapRef.current;

    if (!canvas || !container) {
      return;
    }

    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "rgba(255,255,255,0)",
      penColor: "rgba(28, 34, 43, 0.82)",
      minWidth: 0.25,
      maxWidth: 1.18,
      minDistance: 0.2,
      throttle: 0,
      velocityFilterWeight: 0.86,
    });

    signaturePadRef.current = signaturePad;

    const handleBeginStroke = () => {
      setSignatureUploadError(null);
    };

    const handleEndStroke = () => {
      setSignatureCaptured(!signaturePad.isEmpty());
    };

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = container.getBoundingClientRect();
      const height = window.matchMedia("(max-width: 48rem)").matches ? 168 : 188;
      const existingData = signaturePad.toData();

      canvas.width = rect.width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;

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
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      signaturePad.removeEventListener("beginStroke", handleBeginStroke);
      signaturePad.removeEventListener("endStroke", handleEndStroke);
      signaturePad.off();
      signaturePadRef.current = null;
    };
  }, [signatureCaptureOpen, signatureOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusTarget = menuRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [role="menuitem"]',
    );

    focusTarget?.focus();
  }, [open]);

  async function handleViewSignature() {
    setOpen(false);

    if (!hasValidId) {
      notify.warning(
        "Resguardo no disponible",
        "Este registro aun no tiene un identificador valido para consultar la firma.",
      );
      return;
    }

    setSignatureOpen(true);
    setSignatureLoading(true);
    setSignatureCaptureOpen(false);
    setSignatureCaptured(false);
    setSignatureDataUrl(null);
    setSignatureMessage(null);
    setSignatureUploadError(null);
    setSignatureStatusCode(null);

    try {
      const blob = await getResguardoFirma(id);
      const dataUrl = await blobToDataUrl(blob);
      setSignatureDataUrl(dataUrl);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setSignatureStatusCode(404);
        setSignatureMessage("Este resguardo todavia no tiene firma registrada.");
      } else if (error instanceof ApiError && error.status === 410) {
        setSignatureStatusCode(410);
        setSignatureMessage(
          "La firma esta registrada, pero el archivo ya no esta disponible.",
        );
      } else {
        setSignatureStatusCode(null);
        setSignatureMessage("No fue posible consultar la firma en este momento.");
      }
    } finally {
      setSignatureLoading(false);
    }
  }

  function handleOpenSignatureCapture() {
    setSignatureCaptureOpen(true);
    setSignatureCaptured(false);
    setSignatureUploadError(null);
  }

  function handleClearSignatureCapture() {
    signaturePadRef.current?.clear();
    setSignatureCaptured(false);
    setSignatureUploadError(null);
  }

  async function handleSaveSignature() {
    if (!hasValidId) {
      return;
    }

    const signaturePad = signaturePadRef.current;

    if (!signaturePad || signaturePad.isEmpty()) {
      setSignatureUploadError("Captura una firma antes de guardarla.");
      return;
    }

    setSignatureUploadPending(true);
    setSignatureUploadError(null);

    try {
      const dataUrl = signaturePad.toDataURL("image/png");
      const file = await dataUrlToFile(dataUrl, `firma-resguardo-${id}.png`);
      await uploadResguardoFirma(id, file);

      setSignatureDataUrl(dataUrl);
      setSignatureMessage("La firma se guardo correctamente.");
      setSignatureStatusCode(null);
      setSignatureCaptureOpen(false);
      setSignatureCaptured(false);

      notify.success(
        "Firma guardada",
        `La firma del resguardo ${id} fue registrada correctamente.`,
      );
    } catch (error) {
      const description = getApiErrorMessage(
        error,
        "No fue posible guardar la firma del resguardo.",
      );
      setSignatureUploadError(description);
      notify.error("No fue posible guardar la firma", description);
    } finally {
      setSignatureUploadPending(false);
    }
  }

  async function buildPdfFileForResguardo(resguardoId: number) {
    const resguardo = await getResguardoById(resguardoId);
    let signature: string | undefined;

    try {
      const blob = await getResguardoFirma(resguardoId);
      signature = await blobToDataUrl(blob);
    } catch (error) {
      if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 410)) {
        throw error;
      }
    }

    const draft = mapResguardoToPreviewDraft(resguardo, signature);

    return generateResguardoPdf({
      createdResguardoId: resguardoId,
      draft,
      resguardo,
    });
  }

  async function handleDownloadPdf() {
    setOpen(false);

    if (!hasValidId) {
      notify.warning(
        "Resguardo no disponible",
        "Este registro aun no tiene un identificador valido para descargar el PDF.",
      );
      return;
    }

    setDownloadingPdf(true);

    try {
      const pdf = await buildPdfFileForResguardo(id);

      const downloadUrl = URL.createObjectURL(pdf.blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = pdf.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "No fue posible generar el PDF del resguardo.";
      notify.error("No fue posible descargar el PDF", description);
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleSendEmail() {
    setOpen(false);

    if (!hasValidId) {
      notify.warning(
        "Resguardo no disponible",
        "Este registro aun no tiene un identificador valido para enviar el PDF.",
      );
      return;
    }

    setSendingEmail(true);
    const toastId = notify.loading(
      "Enviando resguardo",
      "Generando el PDF y enviandolo por correo...",
    );

    try {
      const pdf = await buildPdfFileForResguardo(id);
      await sendResguardoEmailWithPdf(id, pdf.file);
      notify.dismiss(toastId);

      notify.success(
        "Correo enviado",
        `El resguardo ${id} fue enviado por correo correctamente.`,
      );
    } catch (error) {
      notify.dismiss(toastId);
      notify.error(
        "No fue posible enviar por email",
        getApiErrorMessage(
          error,
          "No fue posible generar o enviar el PDF del resguardo.",
        ),
      );
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <>
      <div ref={wrapperRef} className={styles.wrapper}>
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Acciones para ${inventario?.trim() || "resguardo"}`}
          onClick={() => setOpen((current) => !current)}
        >
          <MoreHorizontal size={16} strokeWidth={2} />
        </button>

      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className={styles.menu}
              role="menu"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
            >
              {hasValidId ? (
                <Link
                  href={`/resguardos/${id}`}
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <Eye size={15} strokeWidth={1.9} />
                  Ver detalle
                </Link>
              ) : (
                <span className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
                  <Eye size={15} strokeWidth={1.9} />
                  Ver detalle
                </span>
              )}

              <button type="button" className={styles.menuItem} onClick={handleViewSignature}>
                <Signature size={15} strokeWidth={1.9} />
                Ver firma
              </button>

              <button
                type="button"
                className={styles.menuItem}
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
              >
                <Download size={15} strokeWidth={1.9} />
                {downloadingPdf ? "Generando PDF..." : "Descargar PDF"}
              </button>

              <button
                type="button"
                className={styles.menuItem}
                onClick={handleSendEmail}
                disabled={sendingEmail}
              >
                <Mail size={15} strokeWidth={1.9} />
                {sendingEmail ? "Enviando..." : "Enviar por email"}
              </button>
            </div>,
            document.body,
          )
        : null}

      {signatureOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
        >
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
                onClick={() => setSignatureOpen(false)}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {signatureLoading ? (
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
                    onClick={handleClearSignatureCapture}
                    disabled={signatureUploadPending}
                  >
                    <Eraser size={15} strokeWidth={1.9} />
                    Limpiar
                  </button>

                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={handleSaveSignature}
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
                        onClick={handleOpenSignatureCapture}
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
        </div>
      ) : null}
    </>
  );
}
