import { FIXED_ASSIGN_USER_NAME } from "@/lib/constants/assigner";
import type { OptionItem, PreviewResguardoDraft } from "@/lib/types/api";
import { getOptionLabel } from "@/lib/utils/resguardo-draft";

import { ESTADO_OPTIONS } from "./constants";
import { toDraftDetalles } from "./helpers";
import type { DetalleItem } from "./types";

export function buildPreviewDraft(params: {
  formValues: Record<string, string>;
  detalles: DetalleItem[];
  accesorios: OptionItem[];
  marcas: OptionItem[];
  tiposBien: OptionItem[];
  modelos: OptionItem[];
  sistemasOperativos: OptionItem[];
  colores: OptionItem[];
  procesadores: OptionItem[];
  users: OptionItem[];
  assignerNeyemp: string;
  editingResguardoId?: number;
}): PreviewResguardoDraft {
  const {
    formValues,
    detalles,
    accesorios,
    marcas,
    tiposBien,
    modelos,
    sistemasOperativos,
    colores,
    procesadores,
    users,
    assignerNeyemp,
    editingResguardoId,
  } = params;

  return {
    idInventario: formValues.idInventario ?? "",
    marcaId: formValues.marcaId ?? "",
    marca: getOptionLabel(marcas, formValues.marcaId) || formValues.marca || "",
    referenciaInterna: formValues.referenciaInterna ?? "",
    fechaAsignacion: formValues.fechaAsignacion ?? "",
    observaciones: formValues.observaciones ?? "",
    telefono: formValues.telefono ?? "",
    ip: formValues.ip ?? "",
    numeroSerie: formValues.numeroSerie ?? "",
    mac: formValues.mac ?? "",
    idEstadoResguardo: formValues.idEstadoResguardo ?? "1",
    estadoLabel:
      getOptionLabel(ESTADO_OPTIONS, formValues.idEstadoResguardo ?? "1") ||
      "Entregado",
    tipoBienLabel: getOptionLabel(tiposBien, formValues.tipoBienId),
    modeloLabel: getOptionLabel(modelos, formValues.modeloId),
    sistemaOperativoLabel: getOptionLabel(
      sistemasOperativos,
      formValues.sistemaOperativoId,
    ),
    colorMaterialLabel: getOptionLabel(colores, formValues.colorMaterialId),
    procesadorLabel: getOptionLabel(procesadores, formValues.procesadorId),
    usuarioTitularLabel: getOptionLabel(users, formValues.usuarioTitularId),
    usuarioTitularHelper:
      users.find((option) => option.value === formValues.usuarioTitularId)?.helper ?? "",
    usuarioTitularEmail:
      users.find((option) => option.value === formValues.usuarioTitularId)?.email ?? "",
    usuarioResguardaLabel: getOptionLabel(users, formValues.usuarioResguardaId),
    usuarioResguardaHelper:
      users.find((option) => option.value === formValues.usuarioResguardaId)?.helper ?? "",
    usuarioAsignaLabel: FIXED_ASSIGN_USER_NAME,
    usuarioAsignaHelper: "Asignador predeterminado",
    tipoBienId: formValues.tipoBienId ?? "",
    modeloId: formValues.modeloId ?? "",
    sistemaOperativoId: formValues.sistemaOperativoId ?? "",
    colorMaterialId: formValues.colorMaterialId ?? "",
    procesadorId: formValues.procesadorId ?? "",
    usuarioTitularId: formValues.usuarioTitularId ?? "",
    usuarioResguardaId: formValues.usuarioResguardaId ?? "",
    usuarioAsignaId: assignerNeyemp,
    editingResguardoId,
    detalles: toDraftDetalles(detalles, accesorios),
  };
}
