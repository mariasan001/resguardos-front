"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  Signature,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import styles from "@/features/resguardos/ResguardoRowActions.module.css";
import { getResguardoById } from "@/lib/services/resguardos.service";
import { generateResguardoPdf } from "@/lib/services/resguardo-pdf.service";
import { notify } from "@/lib/utils/notify";
import { mapResguardoToPreviewDraft } from "@/lib/utils/resguardo-payload";
import { readResguardoSignature } from "@/lib/utils/resguardo-signature";

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
  const [open, setOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [downloadingPdf, setDownloadingPdf] = useState(false);
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
    if (!open) {
      return;
    }

    const focusTarget = menuRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [role="menuitem"]',
    );

    focusTarget?.focus();
  }, [open]);

  function handleViewSignature() {
    setOpen(false);

    if (!hasValidId) {
      notify.warning(
        "Resguardo no disponible",
        "Este registro aun no tiene un identificador valido para consultar la firma.",
      );
      return;
    }

    const storedSignature = readResguardoSignature(id);
    setSignatureDataUrl(storedSignature);
    setSignatureOpen(true);
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
      const resguardo = await getResguardoById(id);
      const signature = readResguardoSignature(id) ?? undefined;
      const draft = mapResguardoToPreviewDraft(resguardo, signature);
      const pdf = await generateResguardoPdf({
        createdResguardoId: id,
        draft,
        resguardo,
      });

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

  function handleEmailSoon() {
    setOpen(false);
    notify.info(
      "Envio pendiente",
      "El envio por correo estara disponible cuando el PDF este generado.",
    );
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

              <button type="button" className={styles.menuItem} onClick={handleEmailSoon}>
                <Mail size={15} strokeWidth={1.9} />
                Enviar por email
              </button>
            </div>,
            document.body,
          )
        : null}

      {signatureOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => setSignatureOpen(false)}
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

            {signatureDataUrl ? (
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
            ) : (
              <div className={styles.emptySignature}>
                <Signature size={18} strokeWidth={1.8} />
                <p>No hay firma disponible para este resguardo.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
