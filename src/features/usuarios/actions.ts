"use server";

import type { ActionResult } from "@/lib/types/api";
import { updateUsuarioEmail } from "@/lib/services/usuarios.service";
import { getApiErrorMessage } from "@/lib/api/errors";

export async function updateUsuarioEmailAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const neyemp = String(formData.get("neyemp") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!neyemp) {
    return {
      success: false,
      message: "No se recibió la clave del empleado.",
    };
  }

  if (!email) {
    return {
      success: false,
      message: "El correo es obligatorio.",
      fieldErrors: { email: "Ingresa un correo electrónico." },
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return {
      success: false,
      message: "El correo no tiene un formato válido.",
      fieldErrors: { email: "Usa un correo válido." },
    };
  }

  try {
    await updateUsuarioEmail(neyemp, email);

    return {
      success: true,
      message: "Correo actualizado correctamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(
        error,
        "No fue posible actualizar el correo del usuario.",
      ),
    };
  }
}
