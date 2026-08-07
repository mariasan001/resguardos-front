import type { OptionItem } from "@/lib/types/api";

import { REQUIRED_FORM_FIELDS } from "./constants";
import type { DetalleItem, SectionKey } from "./types";

export function collectValidationIssues(params: {
  formValues: Record<string, string>;
  detalles: DetalleItem[];
  accesorios: OptionItem[];
}): {
  message: string;
  section: SectionKey;
  invalidKeys: string[];
} | null {
  const { formValues, detalles } = params;
  const invalidKeys: string[] = [];
  let firstSection: SectionKey | null = null;
  let firstMessage = "";

  for (const field of REQUIRED_FORM_FIELDS) {
    if (!(formValues[field.key] ?? "").trim()) {
      invalidKeys.push(field.key);

      if (!firstSection) {
        firstSection = field.section;
        firstMessage = `Completa los campos obligatorios marcados.`;
      }
    }
  }

  // Accesorios opcionales: sin filas está bien.
  // Si hay filas, cada una pide tipo + marca + modelo + serie en el detalle.
  for (const [index, detalle] of detalles.entries()) {
    const position = index + 1;

    if (!detalle.accesorioId.trim()) {
      invalidKeys.push(`detalle-${detalle.id}-accesorioId`);

      if (!firstSection) {
        firstSection = "extras";
        firstMessage = `Selecciona el accesorio ${position}.`;
      }
    }

    if (!detalle.numeroSerie.trim()) {
      invalidKeys.push(`detalle-${detalle.id}-numeroSerie`);

      if (!firstSection) {
        firstSection = "extras";
        firstMessage = `Captura la serie del accesorio ${position}.`;
      }
    }

    if (!detalle.marcaId.trim()) {
      invalidKeys.push(`detalle-${detalle.id}-marcaId`);

      if (!firstSection) {
        firstSection = "extras";
        firstMessage = `Selecciona la marca del accesorio ${position}.`;
      }
    }

    if (!detalle.modeloId.trim()) {
      invalidKeys.push(`detalle-${detalle.id}-modeloId`);

      if (!firstSection) {
        firstSection = "extras";
        firstMessage = `Selecciona el modelo del accesorio ${position}.`;
      }
    }
  }

  if (!invalidKeys.length || !firstSection) {
    return null;
  }

  return {
    message:
      invalidKeys.length > 1
        ? "Completa los campos obligatorios marcados."
        : firstMessage,
    section: firstSection,
    invalidKeys,
  };
}
