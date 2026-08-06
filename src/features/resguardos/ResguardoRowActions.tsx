"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "@/features/resguardos/ResguardoRowActions.module.css";
import { ApiError, getApiErrorMessage } from "@/lib/api/errors";
import { sendResguardoEmailWithPdf } from "@/lib/services/email.service";
import {
  getResguardoFirma,
  uploadResguardoFirma,
} from "@/lib/services/resguardos.service";
import { blobToDataUrl, dataUrlToFile } from "@/lib/utils/file";
import { notify } from "@/lib/utils/notify";

import { buildPdfFileForResguardo } from "./row-actions/buildPdfFileForResguardo";
import ResguardoActionsMenu from "./row-actions/ResguardoActionsMenu";
import ResguardoSignatureModal from "./row-actions/ResguardoSignatureModal";
import { useActionsMenu } from "./row-actions/useActionsMenu";
import { useSignaturePad } from "./row-actions/useSignaturePad";

interface ResguardoRowActionsProps {
  id?: number;
  inventario?: string;
}

export default function ResguardoRowActions({
  id,
  inventario,
}: ResguardoRowActionsProps) {
  const { wrapperRef, triggerRef, menuRef, open, setOpen, menuPosition } =
    useActionsMenu();
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signatureCaptureOpen, setSignatureCaptureOpen] = useState(false);
  const [signatureUploadPending, setSignatureUploadPending] = useState(false);
  const [signatureUploadError, setSignatureUploadError] = useState<string | null>(null);
  const [signatureStatusCode, setSignatureStatusCode] = useState<number | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const hasValidId = typeof id === "number" && Number.isFinite(id);

  const {
    canvasRef,
    canvasWrapRef,
    signatureCaptured,
    clearSignature,
    getSignaturePad,
    resetCapture,
  } = useSignaturePad({
    active: signatureOpen && signatureCaptureOpen,
    onBeginStroke: () => setSignatureUploadError(null),
  });

  useEffect(() => {
    if (!signatureOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSignatureOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [signatureOpen]);

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
    resetCapture();
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
    resetCapture();
    setSignatureUploadError(null);
  }

  function handleClearSignatureCapture() {
    clearSignature();
    setSignatureUploadError(null);
  }

  async function handleSaveSignature() {
    if (!hasValidId) {
      return;
    }

    const signaturePad = getSignaturePad();

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
      resetCapture();

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
          onMouseDown={(event) => {
            // Prevent the table overflow container from scrolling the trigger
            // into view on focus, which was closing the menu right away.
            event.preventDefault();
          }}
          onClick={() => setOpen((current) => !current)}
        >
          <MoreHorizontal size={16} strokeWidth={2} />
        </button>
      </div>

      <ResguardoActionsMenu
        open={open}
        menuRef={menuRef}
        menuPosition={menuPosition}
        hasValidId={hasValidId}
        id={id}
        downloadingPdf={downloadingPdf}
        sendingEmail={sendingEmail}
        onClose={() => setOpen(false)}
        onViewSignature={handleViewSignature}
        onDownloadPdf={handleDownloadPdf}
        onSendEmail={handleSendEmail}
      />

      <ResguardoSignatureModal
        open={signatureOpen}
        inventario={inventario}
        loading={signatureLoading}
        signatureDataUrl={signatureDataUrl}
        signatureMessage={signatureMessage}
        signatureStatusCode={signatureStatusCode}
        signatureCaptureOpen={signatureCaptureOpen}
        signatureCaptured={signatureCaptured}
        signatureUploadPending={signatureUploadPending}
        signatureUploadError={signatureUploadError}
        canvasRef={canvasRef}
        canvasWrapRef={canvasWrapRef}
        onClose={() => setSignatureOpen(false)}
        onOpenCapture={handleOpenSignatureCapture}
        onClearCapture={handleClearSignatureCapture}
        onSaveSignature={handleSaveSignature}
      />
    </>
  );
}
