"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, getApiErrorMessage } from "@/lib/api/errors";
import { serverBackendRequest } from "@/lib/api/server-backend";
import { canUseApiCapability } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import {
  createAppUser,
  updateAppUser,
} from "@/lib/services/usuarios.server";
import type { ActionResult, AppUser } from "@/lib/types/api";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readAppUserFields(formData: FormData) {
  return {
    neyemp: String(formData.get("neyemp") ?? "").trim(),
    nombre: String(formData.get("nombre") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    necads: String(formData.get("necads") ?? "").trim(),
    neccat: String(formData.get("neccat") ?? "").trim(),
  };
}

function validateAppUserFields(
  fields: ReturnType<typeof readAppUserFields>,
  options: { requireNeyemp: boolean },
): ActionResult | null {
  const fieldErrors: Record<string, string> = {};

  if (options.requireNeyemp && !fields.neyemp) {
    fieldErrors.neyemp = "La clave del empleado es obligatoria.";
  }

  if (!fields.nombre) {
    fieldErrors.nombre = "El nombre es obligatorio.";
  }

  if (!fields.email) {
    fieldErrors.email = "El correo es obligatorio.";
  } else if (!emailPattern.test(fields.email)) {
    fieldErrors.email = "Usa un correo valido.";
  }

  if (!fields.necads) {
    fieldErrors.necads = "Selecciona una adscripcion.";
  }

  if (!fields.neccat) {
    fieldErrors.neccat = "Selecciona un puesto.";
  }

  if (Object.keys(fieldErrors).length) {
    return {
      success: false,
      message: "Completa los campos obligatorios marcados.",
      fieldErrors,
    };
  }

  return null;
}

function mapAppUserMutationError(error: unknown, fallback: string): ActionResult {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return {
        success: false,
        message: "Ya existe un usuario con esa clave de empleado.",
        fieldErrors: { neyemp: "Esta clave ya esta registrada." },
      };
    }

    if (error.status === 404) {
      return {
        success: false,
        message: "El usuario ya no existe.",
      };
    }

    if (error.status === 400) {
      return {
        success: false,
        message:
          error.message ||
          "Adscripcion o puesto invalido. Revisa los catalogos seleccionados.",
      };
    }
  }

  return {
    success: false,
    message: getApiErrorMessage(error, fallback),
  };
}

export async function updateUsuarioEmailAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();

  if (!session || !canUseApiCapability(session.role, "updateUserEmail")) {
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

export async function createAppUserAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();

  if (!session || !canUseApiCapability(session.role, "manageAppUsers")) {
    return {
      success: false,
      message: "No tienes permiso para crear usuarios.",
    };
  }

  const fields = readAppUserFields(formData);
  const validationError = validateAppUserFields(fields, { requireNeyemp: true });

  if (validationError) {
    return validationError;
  }

  let neyemp = fields.neyemp;

  try {
    const created = await createAppUser({
      neyemp: fields.neyemp,
      nombre: fields.nombre,
      email: fields.email,
      necads: fields.necads,
      neccat: fields.neccat,
    });
    neyemp = created.neyemp?.trim() || fields.neyemp;
  } catch (error) {
    return mapAppUserMutationError(error, "No fue posible crear el usuario.");
  }

  revalidatePath("/usuarios");

  const stayOnList = String(formData.get("stayOnList") ?? "") === "1";
  if (stayOnList) {
    return {
      success: true,
      message: "Usuario creado correctamente.",
    };
  }

  redirect(`/usuarios/${encodeURIComponent(neyemp)}`);
}

export async function updateAppUserAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();

  if (!session || !canUseApiCapability(session.role, "manageAppUsers")) {
    return {
      success: false,
      message: "No tienes permiso para actualizar usuarios.",
    };
  }

  const fields = readAppUserFields(formData);
  const validationError = validateAppUserFields(fields, { requireNeyemp: true });

  if (validationError) {
    return validationError;
  }

  try {
    await updateAppUser(fields.neyemp, {
      nombre: fields.nombre,
      email: fields.email,
      necads: fields.necads,
      neccat: fields.neccat,
    });

    revalidatePath("/usuarios");
    revalidatePath(`/usuarios/${fields.neyemp}`);

    return {
      success: true,
      message: "Usuario actualizado correctamente.",
    };
  } catch (error) {
    return mapAppUserMutationError(
      error,
      "No fue posible actualizar el usuario.",
    );
  }
}
