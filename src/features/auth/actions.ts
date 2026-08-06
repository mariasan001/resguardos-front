"use server";

import { redirect } from "next/navigation";

import { getHomeRoute } from "@/lib/auth/permissions";
import { authenticateUser } from "@/lib/auth/provider";
import { createSession, deleteSession } from "@/lib/auth/session";
import type { LoginActionState } from "@/lib/auth/types";
import { ApiError } from "@/lib/api/errors";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fieldErrors: LoginActionState["fieldErrors"] = {};

  if (!username) {
    fieldErrors.username = "Ingresa tu usuario.";
  }

  if (!password) {
    fieldErrors.password = "Ingresa tu contraseña.";
  }

  if (Object.keys(fieldErrors).length) {
    return {
      success: false,
      message: "Revisa los campos obligatorios.",
      fieldErrors,
    };
  }

  try {
    const user = await authenticateUser(username, password);

    if (!user) {
      return {
        success: false,
        message: "El usuario o la contraseña no son correctos.",
      };
    }

    await createSession(user, user.expiresIn);
    redirect(getHomeRoute(user.role));
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: "No fue posible iniciar sesión. Intenta de nuevo.",
      };
    }

    throw error;
  }
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
