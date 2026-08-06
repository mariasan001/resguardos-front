"use client";

import { Check, X } from "lucide-react";

import type { CatalogItem } from "@/features/catalogos/catalogos-types";
import styles from "@/features/catalogos/CatalogosExplorer.module.css";

export default function AccessoryForm({
  title,
  label,
  marcaId,
  modelo,
  brandItems,
  modelItems,
  pending,
  onLabelChange,
  onMarcaChange,
  onModeloChange,
  onSave,
  onCancel,
}: {
  title: string;
  label: string;
  marcaId: string;
  modelo: string;
  brandItems: CatalogItem[];
  modelItems: CatalogItem[];
  pending: boolean;
  onLabelChange: (value: string) => void;
  onMarcaChange: (value: string) => void;
  onModeloChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.accessoryForm}>
      <div className={styles.accessoryFormHead}>
        <h4 className={styles.accessoryFormTitle}>{title}</h4>
        <div className={styles.accessoryFormActions}>
          <button
            type="button"
            className={styles.confirmButton}
            disabled={pending}
            onClick={onSave}
            aria-label="Guardar"
          >
            <Check size={15} strokeWidth={2.2} />
            Guardar
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            disabled={pending}
            onClick={onCancel}
            aria-label="Cancelar"
          >
            <X size={15} strokeWidth={2.2} />
            Cancelar
          </button>
        </div>
      </div>

      <div className={styles.accessoryFormGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Nombre <span className={styles.requiredMark} aria-hidden="true">*</span>
          </span>
          <input
            autoFocus
            required
            className={styles.fieldInput}
            value={label}
            placeholder="Ej. Monitor, teclado, mouse"
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
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Marca <span className={styles.requiredMark} aria-hidden="true">*</span>
          </span>
          <select
            required
            className={styles.fieldInput}
            value={marcaId}
            onChange={(event) => onMarcaChange(event.target.value)}
          >
            <option value="">Selecciona una marca</option>
            {brandItems.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Modelo <span className={styles.requiredMark} aria-hidden="true">*</span>
          </span>
          <select
            required
            className={styles.fieldInput}
            value={modelo}
            onChange={(event) => onModeloChange(event.target.value)}
          >
            <option value="">Selecciona un modelo</option>
            {modelo &&
            !modelItems.some((model) => model.label === modelo) ? (
              <option value={modelo}>{modelo}</option>
            ) : null}
            {modelItems.map((model) => (
              <option key={model.id} value={model.label}>
                {model.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function CatalogDraftEditor({
  singular,
  supportsAccessoryMeta,
  label,
  marcaId,
  modelo,
  brandItems,
  modelItems,
  pending,
  onLabelChange,
  onMarcaChange,
  onModeloChange,
  onSave,
  onCancel,
}: {
  singular: string;
  supportsAccessoryMeta: boolean;
  label: string;
  marcaId: string;
  modelo: string;
  brandItems: CatalogItem[];
  modelItems: CatalogItem[];
  pending: boolean;
  onLabelChange: (value: string) => void;
  onMarcaChange: (value: string) => void;
  onModeloChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (supportsAccessoryMeta) {
    return (
      <AccessoryForm
        title={`Nuevo ${singular}`}
        label={label}
        marcaId={marcaId}
        modelo={modelo}
        brandItems={brandItems}
        modelItems={modelItems}
        pending={pending}
        onLabelChange={onLabelChange}
        onMarcaChange={onMarcaChange}
        onModeloChange={onModeloChange}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

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
