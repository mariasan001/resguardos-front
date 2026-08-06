"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { Download, Eye, Mail, Signature, SquarePen } from "lucide-react";
import type { RefObject } from "react";

import styles from "@/features/resguardos/ResguardoRowActions.module.css";

interface ResguardoActionsMenuProps {
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  menuPosition: { top: number; left: number };
  hasValidId: boolean;
  id?: number;
  downloadingPdf: boolean;
  sendingEmail: boolean;
  onClose: () => void;
  onViewSignature: () => void;
  onDownloadPdf: () => void;
  onSendEmail: () => void;
}

export default function ResguardoActionsMenu({
  open,
  menuRef,
  menuPosition,
  hasValidId,
  id,
  downloadingPdf,
  sendingEmail,
  onClose,
  onViewSignature,
  onDownloadPdf,
  onSendEmail,
}: ResguardoActionsMenuProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
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
          onClick={onClose}
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

      {hasValidId ? (
        <Link
          href={`/resguardos/nuevo?edit=${id}`}
          className={styles.menuItem}
          role="menuitem"
          onClick={onClose}
        >
          <SquarePen size={15} strokeWidth={1.9} />
          Editar
        </Link>
      ) : (
        <span className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
          <SquarePen size={15} strokeWidth={1.9} />
          Editar
        </span>
      )}

      <button type="button" className={styles.menuItem} onClick={onViewSignature}>
        <Signature size={15} strokeWidth={1.9} />
        Ver firma
      </button>

      <button
        type="button"
        className={styles.menuItem}
        onClick={onDownloadPdf}
        disabled={downloadingPdf}
      >
        <Download size={15} strokeWidth={1.9} />
        {downloadingPdf ? "Generando PDF..." : "Descargar PDF"}
      </button>

      <button
        type="button"
        className={styles.menuItem}
        onClick={onSendEmail}
        disabled={sendingEmail}
      >
        <Mail size={15} strokeWidth={1.9} />
        {sendingEmail ? "Enviando..." : "Enviar por email"}
      </button>
    </div>,
    document.body,
  );
}
