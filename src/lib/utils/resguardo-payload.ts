import type { PreviewAccesorioDraft, PreviewResguardoDraft, Resguardo } from "@/lib/types/api";

function mapDetalles(detalles: PreviewAccesorioDraft[]) {
  return detalles
    .filter((detalle) => detalle.accesorioId)
    .map((detalle) => ({
      accesorio: { id: Number(detalle.accesorioId) },
      numeroSerie: detalle.numeroSerie || undefined,
    }));
}

export function mapPreviewDraftToResguardoPayload(
  draft: PreviewResguardoDraft,
): Resguardo {
  return {
    idInventario: draft.idInventario || undefined,
    marca: draft.marca || undefined,
    resguardo: draft.resguardo || undefined,
    fechaAsignacion: draft.fechaAsignacion || undefined,
    observaciones: draft.observaciones || undefined,
    telefono: draft.telefono || undefined,
    ip: draft.ip || undefined,
    numeroSerie: draft.numeroSerie || undefined,
    mac: draft.mac || undefined,
    idEstadoResguardo: Number(draft.idEstadoResguardo || "1"),
    tipoBien: draft.tipoBienId ? { id: Number(draft.tipoBienId) } : undefined,
    modelo: draft.modeloId ? { id: Number(draft.modeloId) } : undefined,
    sistemaOperativo: draft.sistemaOperativoId
      ? { id: Number(draft.sistemaOperativoId) }
      : undefined,
    colorMaterial: draft.colorMaterialId
      ? { id: Number(draft.colorMaterialId) }
      : undefined,
    procesador: draft.procesadorId
      ? { id: Number(draft.procesadorId) }
      : undefined,
    usuarioTitular: draft.usuarioTitularId
      ? { neyemp: draft.usuarioTitularId }
      : undefined,
    usuarioResguarda: draft.usuarioResguardaId
      ? { neyemp: draft.usuarioResguardaId }
      : undefined,
    usuarioAsigna: draft.usuarioAsignaId
      ? { neyemp: draft.usuarioAsignaId }
      : undefined,
    detalles: mapDetalles(draft.detalles),
  };
}

export function extractCreatedResguardoId(
  response: Record<string, number>,
): number | null {
  for (const value of Object.values(response)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}
