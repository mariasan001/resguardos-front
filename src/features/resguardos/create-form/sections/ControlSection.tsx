"use client";

import { CalendarClock } from "lucide-react";

import type { SelectOptionsSource } from "@/lib/types/api";
import FormDatePicker from "@/features/resguardos/FormDatePicker";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { SelectField } from "../fields/SelectField";
import { Section } from "../Section";
import type { SectionKey, SectionStatus } from "../types";

export function ControlSection({
  openKey,
  onToggle,
  status,
  estadoOptionsSource,
  formValues,
  isFieldInvalid,
  updateField,
}: {
  openKey: SectionKey;
  onToggle: (section: SectionKey) => void;
  status: SectionStatus;
  estadoOptionsSource: SelectOptionsSource;
  formValues: Record<string, string>;
  isFieldInvalid: (key: string) => boolean;
  updateField: (name: string, value: string) => void;
}) {
  return (
    <Section
      icon={<CalendarClock size={16} strokeWidth={1.9} />}
      title="Fechas y control"
      description="Fecha de asignacion y estatus administrativo."
      sectionKey="control"
      openKey={openKey}
      onToggle={onToggle}
      status={status}
    >
      <div className={styles.grid}>
        <FormDatePicker
          label="Fecha de asignacion"
          name="fechaAsignacion"
          value={formValues.fechaAsignacion ?? ""}
          className={styles.spanHalf}
          required
          invalid={isFieldInvalid("fechaAsignacion")}
          onChange={(nextValue) => updateField("fechaAsignacion", nextValue)}
        />
        <SelectField
          label="Estado"
          name="idEstadoResguardo"
          source={estadoOptionsSource}
          value={formValues.idEstadoResguardo ?? "1"}
          span="quarter"
          required
          invalid={isFieldInvalid("idEstadoResguardo")}
          onChange={(event) => updateField("idEstadoResguardo", event.target.value)}
        />
      </div>
    </Section>
  );
}
