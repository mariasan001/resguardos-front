import type { OptionItem } from "@/lib/types/api";

import { REQUIRED_FORM_FIELDS } from "./constants";
import { getAccesorioOption } from "./helpers";
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
  const { formValues, detalles, accesorios } = params;
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

  if (detalles.length === 0) {
    invalidKeys.push("accesorios");

    if (!firstSection) {
      firstSection = "extras";
      firstMessage = "Agrega al menos un accesorio con serie.";
    }
  }

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

    const option = getAccesorioOption(accesorios, detalle.accesorioId);

    if (detalle.accesorioId.trim() && !option?.marca?.trim()) {
      invalidKeys.push(`detalle-${detalle.id}-marca`);

      if (!firstSection) {
        firstSection = "extras";
        firstMessage = `El accesorio ${position} no tiene marca en el catalogo.`;
      }
    }

    if (detalle.accesorioId.trim() && !option?.modelo?.trim()) {
      invalidKeys.push(`detalle-${detalle.id}-modelo`);

      if (!firstSection) {
        firstSection = "extras";
        firstMessage = `El accesorio ${position} no tiene modelo en el catalogo.`;
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
