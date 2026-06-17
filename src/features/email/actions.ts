"use server";

import type { ActionResult } from "@/lib/types/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { uploadPdfAndSendEmail } from "@/lib/services/email.service";

export async function sendResguardoEmailAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const rawId = String(formData.get("resguardoId") ?? "").trim();
  const archivo = formData.get("archivo");
  const resguardoId = Number(rawId);

  if (!rawId || Number.isNaN(resguardoId)) {
    return {
      success: false,
      message: "No se recibió un identificador de resguardo válido.",
    };
  }

  if (!(archivo instanceof File) || !archivo.size) {
    return {
      success: false,
      message: "Selecciona un archivo PDF para enviar.",
      fieldErrors: { archivo: "El archivo es obligatorio." },
    };
  }

  if (!archivo.name.toLowerCase().endsWith(".pdf")) {
    return {
      success: false,
      message: "Solo se permiten archivos PDF.",
      fieldErrors: { archivo: "El archivo debe tener extensión .pdf." },
    };
  }

  try {
    const responseMessage = await uploadPdfAndSendEmail(resguardoId, archivo);

    return {
      success: true,
      message: responseMessage || "Archivo enviado correctamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(
        error,
        "No fue posible enviar el resguardo por correo.",
      ),
    };
  }
}
