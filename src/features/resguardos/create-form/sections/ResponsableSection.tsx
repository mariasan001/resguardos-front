"use client";

import { UserRound } from "lucide-react";

import { FIXED_ASSIGN_USER_NAME } from "@/lib/constants/assigner";
import type { SelectOptionsSource } from "@/lib/types/api";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { StaticUserField } from "../fields/StaticUserField";
import { UserComboboxField } from "../fields/UserComboboxField";
import { Section } from "../Section";
import type { SectionKey, SectionStatus } from "../types";

export function ResponsableSection({
  openKey,
  onToggle,
  status,
  userOptionsSource,
  formValues,
  isFieldInvalid,
  updateField,
}: {
  openKey: SectionKey;
  onToggle: (section: SectionKey) => void;
  status: SectionStatus;
  userOptionsSource: SelectOptionsSource;
  formValues: Record<string, string>;
  isFieldInvalid: (key: string) => boolean;
  updateField: (name: string, value: string) => void;
}) {
  return (
    <Section
      icon={<UserRound size={16} strokeWidth={1.9} />}
      title="Datos del responsable"
      description="Personas relacionadas con el resguardo."
      sectionKey="responsable"
      openKey={openKey}
      onToggle={onToggle}
      status={status}
    >
      <div className={styles.grid}>
        <UserComboboxField
          label="Usuario titular"
          name="usuarioTitularId"
          source={userOptionsSource}
          value={formValues.usuarioTitularId ?? ""}
          span="half"
          required
          invalid={isFieldInvalid("usuarioTitularId")}
          onChange={(event) => updateField("usuarioTitularId", event.target.value)}
        />
        <UserComboboxField
          label="Usuario que resguarda"
          name="usuarioResguardaId"
          source={userOptionsSource}
          value={formValues.usuarioResguardaId ?? ""}
          span="half"
          required
          invalid={isFieldInvalid("usuarioResguardaId")}
          onChange={(event) =>
            updateField("usuarioResguardaId", event.target.value)
          }
        />
        <StaticUserField
          label="Usuario que asigna"
          value={FIXED_ASSIGN_USER_NAME}
          helper="Asignador predeterminado"
          span="half"
          required
        />
      </div>
    </Section>
  );
}
