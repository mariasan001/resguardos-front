"use client";

import { Cpu } from "lucide-react";

import type { ResguardoCatalogSources } from "@/lib/types/api";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { Field } from "../fields/Field";
import { SelectField } from "../fields/SelectField";
import { Section } from "../Section";
import type { SectionKey, SectionStatus } from "../types";

export function TecnicoSection({
  openKey,
  onToggle,
  status,
  sources,
  formValues,
  isFieldInvalid,
  updateField,
}: {
  openKey: SectionKey;
  onToggle: (section: SectionKey) => void;
  status: SectionStatus;
  sources: ResguardoCatalogSources;
  formValues: Record<string, string>;
  isFieldInvalid: (key: string) => boolean;
  updateField: (name: string, value: string) => void;
}) {
  return (
    <Section
      icon={<Cpu size={16} strokeWidth={1.9} />}
      title="Especificaciones tecnicas"
      description="Datos tecnicos y de conectividad."
      sectionKey="tecnico"
      openKey={openKey}
      onToggle={onToggle}
      status={status}
    >
      <div className={styles.grid}>
        <SelectField
          label="Procesador"
          name="procesadorId"
          source={sources.procesadores}
          value={formValues.procesadorId ?? ""}
          span="half"
          required
          invalid={isFieldInvalid("procesadorId")}
          onChange={(event) => updateField("procesadorId", event.target.value)}
        />
        <SelectField
          label="Sistema operativo"
          name="sistemaOperativoId"
          source={sources.sistemasOperativos}
          value={formValues.sistemaOperativoId ?? ""}
          span="half"
          required
          invalid={isFieldInvalid("sistemaOperativoId")}
          onChange={(event) =>
            updateField("sistemaOperativoId", event.target.value)
          }
        />
        <SelectField
          label="Color o material"
          name="colorMaterialId"
          source={sources.colores}
          value={formValues.colorMaterialId ?? ""}
          span="half"
          required
          invalid={isFieldInvalid("colorMaterialId")}
          onChange={(event) => updateField("colorMaterialId", event.target.value)}
        />
        <Field
          label="IP"
          name="ip"
          value={formValues.ip ?? ""}
          span="quarter"
          placeholder="192.168.0.10"
          required
          invalid={isFieldInvalid("ip")}
          onChange={(event) => updateField("ip", event.target.value)}
        />
        <Field
          label="MAC"
          name="mac"
          value={formValues.mac ?? ""}
          span="quarter"
          placeholder="00:00:00:00:00:00"
          invalid={isFieldInvalid("mac")}
          onChange={(event) => updateField("mac", event.target.value)}
        />
      </div>
    </Section>
  );
}
