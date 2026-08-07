import type { PreviewResguardoDraft, Resguardo } from "@/lib/types/api";
import { getMarcaLabel, getModeloLabel } from "@/lib/utils/format";

export interface AccesorioPdfItem {
  accesorio?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
}

/** Completa marca/modelo del detalle (o del draft) para el PDF. */
export function buildAccesorioItems(
  resguardo: Resguardo,
  draft: PreviewResguardoDraft,
): AccesorioPdfItem[] {
  const captured = draft.detalles ?? [];
  const stored = resguardo.detalles ?? [];

  if (stored.length) {
    return stored.map((detalle, index) => {
      const fallback =
        captured.find(
          (item) =>
            item.accesorioId &&
            item.accesorioId === String(detalle.accesorio?.id ?? ""),
        ) ?? captured[index];

      return {
        accesorio: detalle.accesorio?.descAccesorio || fallback?.accesorioLabel,
        marca:
          getMarcaLabel(detalle.marca) ||
          getMarcaLabel(detalle.accesorio?.marca) ||
          fallback?.marcaLabel,
        modelo:
          getModeloLabel(detalle.modelo) ||
          (typeof detalle.accesorio?.modelo === "string"
            ? detalle.accesorio.modelo
            : "") ||
          fallback?.modeloLabel,
        numeroSerie: detalle.numeroSerie || fallback?.numeroSerie,
      };
    });
  }

  return captured.map((item) => ({
    accesorio: item.accesorioLabel,
    marca: item.marcaLabel,
    modelo: item.modeloLabel,
    numeroSerie: item.numeroSerie,
  }));
}
