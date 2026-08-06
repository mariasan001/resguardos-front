"use client";

import { Check, Layers, Pencil, Tag, Trash2, X } from "lucide-react";

import AccessoryForm from "@/features/catalogos/AccessoryForm";
import type { CatalogItem } from "@/features/catalogos/catalogos-types";
import styles from "@/features/catalogos/CatalogosExplorer.module.css";

export default function CatalogItemRow({
  item,
  supportsAccessoryMeta,
  isEditing,
  editingLabel,
  editingMarcaId,
  editingModelo,
  brandItems,
  modelItems,
  pending,
  onEditingLabelChange,
  onEditingMarcaChange,
  onEditingModeloChange,
  onSave,
  onCancel,
  onStartEdit,
  onRemove,
}: {
  item: CatalogItem;
  supportsAccessoryMeta: boolean;
  isEditing: boolean;
  editingLabel: string;
  editingMarcaId: string;
  editingModelo: string;
  brandItems: CatalogItem[];
  modelItems: CatalogItem[];
  pending: boolean;
  onEditingLabelChange: (value: string) => void;
  onEditingMarcaChange: (value: string) => void;
  onEditingModeloChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: (item: CatalogItem) => void;
  onRemove: (id: string) => void;
}) {
  if (isEditing) {
    return (
      <li
        className={
          supportsAccessoryMeta ? styles.accessoryEditItem : styles.editorStack
        }
      >
        {supportsAccessoryMeta ? (
          <AccessoryForm
            title={`Editar ${item.label}`}
            label={editingLabel}
            marcaId={editingMarcaId}
            modelo={editingModelo}
            brandItems={brandItems}
            modelItems={modelItems}
            pending={pending}
            onLabelChange={onEditingLabelChange}
            onMarcaChange={onEditingMarcaChange}
            onModeloChange={onEditingModeloChange}
            onSave={onSave}
            onCancel={onCancel}
          />
        ) : (
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
        )}
      </li>
    );
  }

  if (supportsAccessoryMeta) {
    return (
      <li className={styles.accessoryCard}>
        <div className={styles.accessoryCardBody}>
          <span className={styles.accessoryName}>{item.label}</span>
          <div className={styles.accessoryMetaRow}>
            <span
              className={styles.accessoryChip}
              data-empty={!item.marca || undefined}
            >
              <Tag size={12} strokeWidth={2} aria-hidden="true" />
              {item.marca || "Sin marca"}
            </span>
            <span
              className={styles.accessoryChip}
              data-empty={!item.modelo || undefined}
            >
              <Layers size={12} strokeWidth={2} aria-hidden="true" />
              {item.modelo || "Sin modelo"}
            </span>
          </div>
        </div>
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
