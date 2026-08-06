"use client";

import { Building2 } from "lucide-react";

import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { Field } from "../fields/Field";
import { Section } from "../Section";
import type { SectionKey, SectionStatus } from "../types";

export function UbicacionSection({
  openKey,
  onToggle,
  status,
  formValues,
  isFieldInvalid,
  updateField,
}: {
  openKey: SectionKey;
  onToggle: (section: SectionKey) => void;
  status: SectionStatus;
  formValues: Record<string, string>;
  isFieldInvalid: (key: string) => boolean;
  updateField: (name: string, value: string) => void;
}) {
  return (
    <Section
      icon={<Building2 size={16} strokeWidth={1.9} />}
      title="Ubicacion y asignacion"
      description="Datos de referencia para control interno."
      sectionKey="ubicacion"
      openKey={openKey}
      onToggle={onToggle}
      status={status}
    >
      <div className={styles.grid}>
        <Field
          label="Referencia interna"
          name="referenciaInterna"
          value={formValues.referenciaInterna ?? ""}
          span="half"
          placeholder="Referencia de area o control interno"
          required
          invalid={isFieldInvalid("referenciaInterna")}
          onChange={(event) => updateField("referenciaInterna", event.target.value)}
        />
        <Field
          label="Telefono de contacto"
          name="telefono"
          value={formValues.telefono ?? ""}
          span="half"
          placeholder="5551234567"
          required
          invalid={isFieldInvalid("telefono")}
          onChange={(event) => updateField("telefono", event.target.value)}
        />
      </div>
    </Section>
  );
}
