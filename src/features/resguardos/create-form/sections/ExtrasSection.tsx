"use client";

import { NotebookPen, Plus, Trash2 } from "lucide-react";

import type { OptionItem, ResguardoCatalogSources } from "@/lib/types/api";
import { getOptionLabel } from "@/lib/utils/resguardo-draft";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { Field } from "../fields/Field";
import { FieldLabel } from "../fields/FieldLabel";
import { SelectField } from "../fields/SelectField";
import { StaticUserField } from "../fields/StaticUserField";
import { getAccesorioOption } from "../helpers";
import { Section } from "../Section";
import type { DetalleItem, SectionKey, SectionStatus } from "../types";

export function ExtrasSection({
  openKey,
  onToggle,
  status,
  sources,
  accesorios,
  formValues,
  detalles,
  isFieldInvalid,
  updateField,
  updateDetalle,
  addDetalle,
  removeDetalle,
}: {
  openKey: SectionKey;
  onToggle: (section: SectionKey) => void;
  status: SectionStatus;
  sources: ResguardoCatalogSources;
  accesorios: OptionItem[];
  formValues: Record<string, string>;
  detalles: DetalleItem[];
  isFieldInvalid: (key: string) => boolean;
  updateField: (name: string, value: string) => void;
  updateDetalle: (
    id: string,
    key: "accesorioId" | "numeroSerie",
    value: string,
  ) => void;
  addDetalle: () => void;
  removeDetalle: (id: string) => void;
}) {
  return (
    <Section
      icon={<NotebookPen size={16} strokeWidth={1.9} />}
      title="Observaciones y extras"
      description="Accesorios y notas de seguimiento."
      sectionKey="extras"
      openKey={openKey}
      onToggle={onToggle}
      status={status}
    >
      <label className={`${styles.fieldBlock} ${styles.spanFull}`}>
        <FieldLabel label="Observaciones" required />
        <textarea
          className={`${styles.textarea} ${
            isFieldInvalid("observaciones") ? styles.inputInvalid : ""
          }`}
          name="observaciones"
          rows={4}
          required
          aria-invalid={isFieldInvalid("observaciones") || undefined}
          value={formValues.observaciones ?? ""}
          placeholder="Notas relevantes del resguardo."
          onChange={(event) => updateField("observaciones", event.target.value)}
        />
      </label>

      <div className={`${styles.detailBlock} ${styles.spanFull}`}>
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderCopy}>
            <span className={styles.detailHeaderTitle}>
              Accesorios
              <span className={styles.requiredMark} aria-hidden="true">
                {" "}
                *
              </span>
            </span>
            <span className={styles.detailHeaderHint}>
              {detalles.length
                ? `${detalles.length} accesorio${detalles.length === 1 ? "" : "s"} agregado${
                    detalles.length === 1 ? "" : "s"
                  }.`
                : "Agrega al menos un accesorio con su serie."}
            </span>
          </div>
          <button
            type="button"
            className={styles.detailAddButton}
            onClick={addDetalle}
          >
            <Plus size={15} strokeWidth={2.2} />
            Nuevo accesorio
          </button>
        </div>

        {detalles.length ? (
          <div className={styles.detailList}>
            {detalles.map((detalle, index) => (
              <article key={detalle.id} className={styles.detailCard} data-motion-item>
                <header className={styles.detailCardHeader}>
                  <span className={styles.detailIndex}>{index + 1}</span>
                  <span className={styles.detailCardTitle}>
                    {getOptionLabel(accesorios, detalle.accesorioId) ||
                      "Accesorio sin definir"}
                  </span>
                  <button
                    type="button"
                    className={styles.removeIconButton}
                    onClick={() => removeDetalle(detalle.id)}
                    aria-label={`Quitar accesorio ${index + 1}`}
                    title="Quitar accesorio"
                  >
                    <Trash2 size={15} strokeWidth={1.9} />
                  </button>
                </header>

                <div className={styles.detailCardBody}>
                  <SelectField
                    label="Accesorio"
                    name={`detalle-accesorio-${index}`}
                    source={sources.accesorios}
                    value={detalle.accesorioId}
                    required
                    invalid={isFieldInvalid(`detalle-${detalle.id}-accesorioId`)}
                    onChange={(event) =>
                      updateDetalle(detalle.id, "accesorioId", event.target.value)
                    }
                    span="half"
                  />
                  <Field
                    label="Serie del accesorio"
                    name={`detalle-serie-${index}`}
                    value={detalle.numeroSerie}
                    placeholder="Numero de serie"
                    required
                    invalid={isFieldInvalid(`detalle-${detalle.id}-numeroSerie`)}
                    onChange={(event) =>
                      updateDetalle(detalle.id, "numeroSerie", event.target.value)
                    }
                    span="half"
                  />
                  <StaticUserField
                    label="Marca"
                    value={
                      getAccesorioOption(accesorios, detalle.accesorioId)?.marca ||
                      "Sin marca en el catalogo"
                    }
                    span="half"
                    required
                    invalid={isFieldInvalid(`detalle-${detalle.id}-marca`)}
                  />
                  <StaticUserField
                    label="Modelo"
                    value={
                      getAccesorioOption(accesorios, detalle.accesorioId)?.modelo ||
                      "Sin modelo en el catalogo"
                    }
                    span="half"
                    required
                    invalid={isFieldInvalid(`detalle-${detalle.id}-modelo`)}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <button
            type="button"
            className={`${styles.detailEmptyCard} ${
              isFieldInvalid("accesorios") ? styles.detailEmptyCardInvalid : ""
            }`}
            onClick={addDetalle}
            data-motion-item
          >
            <span className={styles.detailAddIcon}>
              <Plus size={18} strokeWidth={2} />
            </span>
            <span className={styles.detailAddLabel}>Agregar el primer accesorio</span>
            <span className={styles.emptyAccessories}>
              Elige el accesorio del catalogo; su marca y modelo se completan solos
              y tu capturas la serie.
            </span>
          </button>
        )}
      </div>
    </Section>
  );
}
