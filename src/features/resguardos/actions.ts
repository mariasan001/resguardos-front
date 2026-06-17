"use server";

import type {
  ActionResult,
  CreateResguardoInput,
  Resguardo,
  ResguardoDetailInput,
} from "@/lib/types/api";
import { createResguardo } from "@/lib/services/resguardos.service";
import { getApiErrorMessage } from "@/lib/api/errors";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseDetalles(formData: FormData): ResguardoDetailInput[] {
  const serialized = getString(formData, "detallesPayload");

  if (!serialized) {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized) as ResguardoDetailInput[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function validateInput(input: CreateResguardoInput) {
  const fieldErrors: Record<string, string> = {};

  if (!input.idInventario) fieldErrors.idInventario = "El inventario es obligatorio.";
  if (!input.marca) fieldErrors.marca = "La marca es obligatoria.";
  if (!input.fechaAsignacion) {
    fieldErrors.fechaAsignacion = "La fecha de asignación es obligatoria.";
  }
  if (!input.tipoBienId) fieldErrors.tipoBienId = "Selecciona un tipo de bien.";
  if (!input.modeloId) fieldErrors.modeloId = "Selecciona un modelo.";
  if (!input.sistemaOperativoId) {
    fieldErrors.sistemaOperativoId = "Selecciona un sistema operativo.";
  }
  if (!input.colorMaterialId) {
    fieldErrors.colorMaterialId = "Selecciona un color o material.";
  }
  if (!input.procesadorId) {
    fieldErrors.procesadorId = "Selecciona un procesador.";
  }
  if (!input.usuarioTitularId) {
    fieldErrors.usuarioTitularId = "Selecciona un usuario titular.";
  }
  if (!input.usuarioResguardaId) {
    fieldErrors.usuarioResguardaId = "Selecciona quién resguarda.";
  }
  if (!input.usuarioAsignaId) {
    fieldErrors.usuarioAsignaId = "Selecciona quién asigna.";
  }

  return fieldErrors;
}

function mapInputToPayload(input: CreateResguardoInput): Resguardo {
  return {
    idInventario: input.idInventario,
    marca: input.marca,
    resguardo: input.resguardo,
    fechaAsignacion: input.fechaAsignacion,
    observaciones: input.observaciones,
    telefono: input.telefono,
    ip: input.ip,
    numeroSerie: input.numeroSerie,
    mac: input.mac,
    idEstadoResguardo: Number(input.idEstadoResguardo || "1"),
    tipoBien: input.tipoBienId ? { id: Number(input.tipoBienId) } : undefined,
    modelo: input.modeloId ? { id: Number(input.modeloId) } : undefined,
    sistemaOperativo: input.sistemaOperativoId
      ? { id: Number(input.sistemaOperativoId) }
      : undefined,
    colorMaterial: input.colorMaterialId
      ? { id: Number(input.colorMaterialId) }
      : undefined,
    procesador: input.procesadorId
      ? { id: Number(input.procesadorId) }
      : undefined,
    usuarioTitular: input.usuarioTitularId
      ? { neyemp: input.usuarioTitularId }
      : undefined,
    usuarioResguarda: input.usuarioResguardaId
      ? { neyemp: input.usuarioResguardaId }
      : undefined,
    usuarioAsigna: input.usuarioAsignaId
      ? { neyemp: input.usuarioAsignaId }
      : undefined,
    detalles: input.detalles
      .filter((detalle) => detalle.accesorioId)
      .map((detalle) => ({
        accesorio: { id: Number(detalle.accesorioId) },
        numeroSerie: detalle.numeroSerie,
      })),
  };
}

export async function createResguardoAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const input: CreateResguardoInput = {
    idInventario: getString(formData, "idInventario"),
    marca: getString(formData, "marca"),
    resguardo: getString(formData, "resguardo"),
    fechaAsignacion: getString(formData, "fechaAsignacion"),
    observaciones: getString(formData, "observaciones"),
    telefono: getString(formData, "telefono"),
    ip: getString(formData, "ip"),
    numeroSerie: getString(formData, "numeroSerie"),
    mac: getString(formData, "mac"),
    idEstadoResguardo: getString(formData, "idEstadoResguardo") || "1",
    tipoBienId: getString(formData, "tipoBienId"),
    modeloId: getString(formData, "modeloId"),
    sistemaOperativoId: getString(formData, "sistemaOperativoId"),
    colorMaterialId: getString(formData, "colorMaterialId"),
    procesadorId: getString(formData, "procesadorId"),
    usuarioTitularId: getString(formData, "usuarioTitularId"),
    usuarioResguardaId: getString(formData, "usuarioResguardaId"),
    usuarioAsignaId: getString(formData, "usuarioAsignaId"),
    detalles: parseDetalles(formData),
  };

  const fieldErrors = validateInput(input);

  if (Object.keys(fieldErrors).length) {
    return {
      success: false,
      message: "Revisa los campos obligatorios para crear el resguardo.",
      fieldErrors,
    };
  }

  try {
    const result = await createResguardo(mapInputToPayload(input));
    const createdId = Object.values(result)[0];

    return {
      success: true,
      message: "Resguardo creado correctamente.",
      createdId,
    };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(
        error,
        "No fue posible crear el resguardo con la información enviada.",
      ),
    };
  }
}
