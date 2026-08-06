"use client";

import { Package2 } from "lucide-react";

import type { ResguardoCatalogSources } from "@/lib/types/api";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { Field } from "../fields/Field";
import { SelectField } from "../fields/SelectField";
import { Section } from "../Section";
import type { SectionKey, SectionStatus } from "../types";

export function EquipoSection({
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
      icon={<Package2 size={16} strokeWidth={1.9} />}
      title="Datos del equipo"
      description="Identificacion principal del equipo."
      sectionKey="equipo"
      openKey={openKey}
      onToggle={onToggle}
      status={status}
    >
      <div className={styles.grid}>
        <Field
          label="Inventario"
          name="idInventario"
          value={formValues.idInventario ?? ""}
          span="third"
          required
          invalid={isFieldInvalid("idInventario")}
          readOnly
        />
        <SelectField
          label="Marca"
          name="marcaId"
          source={sources.marcas}
          value={formValues.marcaId ?? ""}
          span="third"
          required
          invalid={isFieldInvalid("marcaId")}
          onChange={(event) => updateField("marcaId", event.target.value)}
        />
        <SelectField
          label="Tipo de bien"
          name="tipoBienId"
          source={sources.tiposBien}
          value={formValues.tipoBienId ?? ""}
          span="third"
          required
          invalid={isFieldInvalid("tipoBienId")}
          onChange={(event) => updateField("tipoBienId", event.target.value)}
        />
        <SelectField
          label="Modelo"
          name="modeloId"
          source={sources.modelos}
          value={formValues.modeloId ?? ""}
          span="third"
          required
          invalid={isFieldInvalid("modeloId")}
          onChange={(event) => updateField("modeloId", event.target.value)}
        />
        <Field
          label="Numero de serie"
          name="numeroSerie"
          value={formValues.numeroSerie ?? ""}
          span="third"
          required
          invalid={isFieldInvalid("numeroSerie")}
          onChange={(event) => updateField("numeroSerie", event.target.value)}
        />
      </div>
    </Section>
  );
}
