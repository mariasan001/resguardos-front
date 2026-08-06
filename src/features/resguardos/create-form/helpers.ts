import type { OptionItem, PreviewAccesorioDraft } from "@/lib/types/api";

import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import type { BaseFieldProps, DetalleItem, SectionKey, SectionStatus } from "./types";

export function nextDetailId() {
  return globalThis.crypto?.randomUUID?.() ?? `detalle-${Date.now()}-${Math.random()}`;
}

export function getSpanClass(span: BaseFieldProps["span"]) {
  switch (span) {
    case "half":
      return styles.spanHalf;
    case "third":
      return styles.spanThird;
    case "quarter":
      return styles.spanQuarter;
    case "twoThirds":
      return styles.spanTwoThirds;
    case "full":
    default:
      return styles.spanFull;
  }
}

export function getCount(values: Record<string, string>, keys: string[]) {
  return keys.filter((key) => values[key]?.trim()).length;
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function getSectionStatus(
  section: SectionKey,
  values: Record<string, string>,
  details: DetalleItem[],
): SectionStatus {
  switch (section) {
    case "equipo":
      return {
        completed: getCount(values, [
          "idInventario",
          "marcaId",
          "tipoBienId",
          "modeloId",
          "numeroSerie",
        ]),
        total: 5,
      };
    case "tecnico":
      return {
        completed: getCount(values, [
          "procesadorId",
          "sistemaOperativoId",
          "colorMaterialId",
          "ip",
          "mac",
        ]),
        total: 5,
      };
    case "responsable":
      return {
        completed:
          getCount(values, ["usuarioTitularId", "usuarioResguardaId"]) + 1,
        total: 3,
      };
    case "ubicacion":
      return {
        completed: getCount(values, ["telefono", "referenciaInterna"]),
        total: 2,
      };
    case "control":
      return {
        completed: getCount(values, ["fechaAsignacion", "idEstadoResguardo"]),
        total: 2,
      };
    case "extras": {
      const hasNotes = Boolean(values.observaciones?.trim());
      const accessoriesOk =
        details.length === 0 ||
        details.every(
          (detail) => detail.accesorioId.trim() && detail.numeroSerie.trim(),
        );
      return {
        completed: Number(hasNotes) + Number(accessoriesOk),
        total: 2,
      };
    }
    default:
      return {
        completed: 0,
        total: 0,
      };
  }
}

export function getAccesorioOption(accesorios: OptionItem[], accesorioId: string) {
  return accesorios.find((item) => item.value === accesorioId);
}

export function toDraftDetalles(
  detalles: DetalleItem[],
  accesorios: OptionItem[],
): PreviewAccesorioDraft[] {
  return detalles.map((detalle) => {
    const option = getAccesorioOption(accesorios, detalle.accesorioId);

    return {
      id: detalle.id,
      detalleId: detalle.detalleId,
      accesorioId: detalle.accesorioId,
      accesorioLabel: option?.label ?? "",
      marcaId: option?.marcaId ?? "",
      marcaLabel: option?.marca ?? "",
      modeloLabel: option?.modelo ?? "",
      numeroSerie: detalle.numeroSerie,
    };
  });
}
