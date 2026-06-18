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

export function mapResguardoToPreviewDraft(
  resguardo: Resguardo,
  signatureDataUrl?: string,
): PreviewResguardoDraft {
  return {
    idInventario: resguardo.idInventario ?? "",
    marca: resguardo.marca ?? "",
    resguardo: resguardo.resguardo ?? "",
    fechaAsignacion: resguardo.fechaAsignacion ?? "",
    observaciones: resguardo.observaciones ?? "",
    telefono: resguardo.telefono ?? "",
    ip: resguardo.ip ?? "",
    numeroSerie: resguardo.numeroSerie ?? "",
    mac: resguardo.mac ?? "",
    idEstadoResguardo: String(resguardo.idEstadoResguardo ?? 1),
    estadoLabel:
      resguardo.idEstadoResguardo === 2
        ? "Devuelto"
        : resguardo.idEstadoResguardo === 3
          ? "Cancelado"
          : "Activo",
    tipoBienLabel: resguardo.tipoBien?.descTipoBien ?? "",
    modeloLabel: resguardo.modelo?.descModelo ?? "",
    sistemaOperativoLabel: resguardo.sistemaOperativo?.descSo ?? "",
    colorMaterialLabel: resguardo.colorMaterial?.descMaterial ?? "",
    procesadorLabel: resguardo.procesador?.descProcesador ?? "",
    usuarioTitularLabel: resguardo.usuarioTitular?.nombre ?? "",
    usuarioTitularHelper:
      [resguardo.usuarioTitular?.neyemp, resguardo.usuarioTitular?.adscripcion?.desAds]
        .filter(Boolean)
        .join(" · ") || undefined,
    usuarioTitularEmail: resguardo.usuarioTitular?.email ?? "",
    usuarioResguardaLabel: resguardo.usuarioResguarda?.nombre ?? "",
    usuarioResguardaHelper:
      [resguardo.usuarioResguarda?.neyemp, resguardo.usuarioResguarda?.adscripcion?.desAds]
        .filter(Boolean)
        .join(" · ") || undefined,
    usuarioAsignaLabel: resguardo.usuarioAsigna?.nombre ?? "",
    usuarioAsignaHelper:
      [resguardo.usuarioAsigna?.neyemp, resguardo.usuarioAsigna?.adscripcion?.desAds]
        .filter(Boolean)
        .join(" · ") || undefined,
    signatureDataUrl,
    createdResguardoId: resguardo.id,
    tipoBienId: resguardo.tipoBien?.id ? String(resguardo.tipoBien.id) : "",
    modeloId: resguardo.modelo?.id ? String(resguardo.modelo.id) : "",
    sistemaOperativoId: resguardo.sistemaOperativo?.id
      ? String(resguardo.sistemaOperativo.id)
      : "",
    colorMaterialId: resguardo.colorMaterial?.id
      ? String(resguardo.colorMaterial.id)
      : "",
    procesadorId: resguardo.procesador?.id ? String(resguardo.procesador.id) : "",
    usuarioTitularId: resguardo.usuarioTitular?.neyemp ?? "",
    usuarioResguardaId: resguardo.usuarioResguarda?.neyemp ?? "",
    usuarioAsignaId: resguardo.usuarioAsigna?.neyemp ?? "",
    detalles:
      resguardo.detalles?.map((detalle, index) => ({
        id: `${resguardo.id ?? "resguardo"}-detalle-${index}`,
        accesorioId: detalle.accesorio?.id ? String(detalle.accesorio.id) : "",
        accesorioLabel: detalle.accesorio?.descAccesorio ?? "",
        numeroSerie: detalle.numeroSerie ?? "",
      })) ?? [],
  };
}
