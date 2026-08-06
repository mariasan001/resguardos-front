import type {
  CreateResguardoResponse,
  DetalleResguardo,
  PreviewAccesorioDraft,
  PreviewResguardoDraft,
  Resguardo,
} from "@/lib/types/api";
import { FIXED_ASSIGN_USER_NAME } from "@/lib/constants/assigner";
import { getEstadoLabel, getMarcaId, getMarcaLabel } from "@/lib/utils/format";

export const ESTADO_ENTREGADO = 1;
export const ESTADO_MODIFICADO = 2;
export const ESTADO_BAJA = 3;

/**
 * Contrato backend: detalles solo necesita accesorio.id + numeroSerie.
 * En PUT, si se manda detalles se reemplaza toda la lista.
 */
function mapDetalles(detalles: PreviewAccesorioDraft[]): DetalleResguardo[] {
  return detalles
    .filter((detalle) => detalle.accesorioId)
    .map((detalle) => ({
      accesorio: {
        id: Number(detalle.accesorioId),
      },
      numeroSerie: detalle.numeroSerie || undefined,
    }));
}

/**
 * En actualización: Baja se respeta; cualquier otro estado pasa a Modificado
 * (incluye Entregado si el usuario olvidó cambiarlo).
 */
export function resolveEstadoForUpdate(selectedEstado: number) {
  if (selectedEstado === ESTADO_BAJA) {
    return ESTADO_BAJA;
  }

  return ESTADO_MODIFICADO;
}

export interface MapResguardoPayloadOptions {
  mode?: "create" | "update";
  usuarioModifica?: string;
}

export function mapPreviewDraftToResguardoPayload(
  draft: PreviewResguardoDraft,
  options: MapResguardoPayloadOptions = {},
): Resguardo {
  const referenciaInterna = draft.referenciaInterna || draft.resguardo || "";
  const selectedEstado = Number(draft.idEstadoResguardo || String(ESTADO_ENTREGADO));
  const idEstadoResguardo =
    options.mode === "update"
      ? resolveEstadoForUpdate(selectedEstado)
      : selectedEstado;

  return {
    idInventario: draft.idInventario || undefined,
    idMarca: draft.marcaId ? Number(draft.marcaId) : undefined,
    resguardo: referenciaInterna || undefined,
    fechaAsignacion: draft.fechaAsignacion || undefined,
    observaciones: draft.observaciones || undefined,
    telefono: draft.telefono || undefined,
    ip: draft.ip || undefined,
    numeroSerie: draft.numeroSerie || undefined,
    mac: draft.mac || undefined,
    idEstadoResguardo,
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
    ...(options.mode === "update" && options.usuarioModifica?.trim()
      ? { usuarioModifica: options.usuarioModifica.trim() }
      : {}),
    detalles: mapDetalles(draft.detalles ?? []),
  };
}

export function getEstadoDraftFields(idEstadoResguardo: number) {
  return {
    idEstadoResguardo: String(idEstadoResguardo),
    estadoLabel: getEstadoLabel(idEstadoResguardo),
  };
}

export function extractCreatedResguardoId(response: CreateResguardoResponse): number {
  const preferredKeys = ["id", "resguardoId", "idResguardo"] as const;

  for (const key of preferredKeys) {
    const value = response[key];

    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  for (const value of Object.values(response)) {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  throw new Error("No fue posible identificar el id del resguardo creado.");
}

export function mapResguardoToPreviewDraft(
  resguardo: Resguardo,
  signatureDataUrl?: string,
): PreviewResguardoDraft {
  return {
    idInventario: resguardo.idInventario ?? "",
    marca: getMarcaLabel(resguardo.marca),
    marcaId: getMarcaId(resguardo.marca, resguardo.idMarca),
    referenciaInterna: resguardo.resguardo ?? "",
    fechaAsignacion: resguardo.fechaAsignacion ?? "",
    observaciones: resguardo.observaciones ?? "",
    telefono: resguardo.telefono ?? "",
    ip: resguardo.ip ?? "",
    numeroSerie: resguardo.numeroSerie ?? "",
    mac: resguardo.mac ?? "",
    idEstadoResguardo: String(resguardo.idEstadoResguardo ?? 1),
    estadoLabel:
      resguardo.idEstadoResguardo === 2
        ? "Modificado"
        : resguardo.idEstadoResguardo === 3
          ? "Baja"
          : "Entregado",
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
    usuarioAsignaLabel: FIXED_ASSIGN_USER_NAME,
    usuarioAsignaHelper: "Asignador predeterminado",
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
        id: `${resguardo.id ?? "resguardo"}-detalle-${detalle.id ?? index}`,
        detalleId:
          typeof detalle.id === "number" && detalle.id > 0
            ? detalle.id
            : undefined,
        accesorioId: detalle.accesorio?.id ? String(detalle.accesorio.id) : "",
        accesorioLabel: detalle.accesorio?.descAccesorio ?? "",
        marcaId: getMarcaId(detalle.accesorio?.marca, detalle.accesorio?.idMarca),
        marcaLabel: getMarcaLabel(detalle.accesorio?.marca),
        modeloLabel: detalle.accesorio?.modelo ?? "",
        numeroSerie: detalle.numeroSerie ?? "",
      })) ?? [],
  };
}

/**
 * El borrador de edicion reutiliza el mapeo de preview, pero sin marcarlo como
 * resguardo ya generado: eso reactivaria el flujo de PDF en lugar del de captura.
 */
export function mapResguardoToEditDraft(resguardo: Resguardo): PreviewResguardoDraft {
  const draft = mapResguardoToPreviewDraft(resguardo);

  return {
    ...draft,
    createdResguardoId: undefined,
    signatureDataUrl: undefined,
    editingResguardoId: resguardo.id,
  };
}
