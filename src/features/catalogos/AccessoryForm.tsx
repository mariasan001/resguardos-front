"use client";

import { Check, X } from "lucide-react";

import styles from "@/features/catalogos/CatalogosExplorer.module.css";

export function CatalogDraftEditor({
  singular,
  label,
  pending,
  onLabelChange,
  onSave,
  onCancel,
}: {
  singular: string;
  label: string;
  pending: boolean;
  onLabelChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.editorRow}>
      <input
        autoFocus
        className={styles.editorInput}
        value={label}
        placeholder={`Nombre del nuevo ${singular}`}
        onChange={(event) => onLabelChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSave();
          }
          if (event.key === "Escape") {
            onCancel();
          }
        }}
      />
      <button
        type="button"
        className={styles.confirmButtonIcon}
        disabled={pending}
        onClick={onSave}
        aria-label="Guardar elemento"
      >
        <Check size={15} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        className={styles.cancelButtonIcon}
        disabled={pending}
        onClick={onCancel}
        aria-label="Cancelar"
      >
        <X size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}
