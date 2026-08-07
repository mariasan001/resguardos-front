"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";

import type { CatalogItem } from "@/features/catalogos/catalogos-types";
import styles from "@/features/catalogos/CatalogosExplorer.module.css";

export default function CatalogItemRow({
  item,
  isEditing,
  editingLabel,
  pending,
  onEditingLabelChange,
  onSave,
  onCancel,
  onStartEdit,
  onRemove,
}: {
  item: CatalogItem;
  isEditing: boolean;
  editingLabel: string;
  pending: boolean;
  onEditingLabelChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: (item: CatalogItem) => void;
  onRemove: (id: string) => void;
}) {
  if (isEditing) {
    return (
      <li className={styles.editorStack}>
        <div className={styles.editorRow}>
          <input
            autoFocus
            className={styles.editorInput}
            value={editingLabel}
            onChange={(event) => onEditingLabelChange(event.target.value)}
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
            aria-label="Guardar cambios"
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
      </li>
    );
  }

  return (
    <li className={styles.item}>
      <span className={styles.itemCopy}>
        <span className={styles.itemLabel}>{item.label}</span>
      </span>
      <span className={styles.itemActions}>
        <button
          type="button"
          className={styles.itemAction}
          disabled={pending}
          onClick={() => onStartEdit(item)}
          aria-label={`Editar ${item.label}`}
          title="Editar"
        >
          <Pencil size={14} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          className={`${styles.itemAction} ${styles.itemActionDanger}`}
          disabled={pending}
          onClick={() => onRemove(item.id)}
          aria-label={`Eliminar ${item.label}`}
          title="Eliminar"
        >
          <Trash2 size={14} strokeWidth={1.9} />
        </button>
      </span>
    </li>
  );
}
