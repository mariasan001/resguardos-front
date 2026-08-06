"use server";

import { getApiErrorMessage } from "@/lib/api/errors";
import { serverBackendRequest } from "@/lib/api/server-backend";
import { getSession } from "@/lib/auth/session";
import type { ActionResult, AppUser } from "@/lib/types/api";

export async function updateUsuarioEmailAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      message: "No tienes permiso para actualizar correos de usuarios.",
    };
  }

  const neyemp = String(formData.get("neyemp") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!neyemp) {
    return {
      success: false,
      message: "No se recibio la clave del empleado.",
    };
  }

  if (!email) {
    return {
      success: false,
      message: "El correo es obligatorio.",
      fieldErrors: { email: "Ingresa un correo electronico." },
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return {
      success: false,
      message: "El correo no tiene un formato valido.",
      fieldErrors: { email: "Usa un correo valido." },
    };
  }

  try {
    const updatedUser = await serverBackendRequest<AppUser>(
      `/api/${neyemp}/email`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );

    if (updatedUser.neyemp !== neyemp) {
      return {
        success: false,
        message: "La respuesta no coincide con el usuario solicitado.",
      };
    }

    if ((updatedUser.email ?? "").trim() !== email) {
      return {
        success: false,
        message: "El backend no confirmo el correo actualizado.",
      };
    }

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
