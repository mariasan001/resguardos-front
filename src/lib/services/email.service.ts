import { backendRequest } from "@/lib/api/backend-client";
import { ApiError } from "@/lib/api/errors";

async function parseTextResponse(response: Response) {
  const payload = await response.text();

  if (!response.ok) {
    throw new ApiError(
      payload.trim() || "No fue posible enviar el resguardo por correo.",
      response.status,
      payload,
    );
  }

  return payload;
}

export async function sendResguardoEmailWithPdf(id: number, archivo: File): Promise<void> {
  const formData = new FormData();
  formData.append("archivo", archivo);

  if (typeof window !== "undefined") {
    await fetch(`/api/email/cargar-con-archivo/${id}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      },
      body: formData,
    }).then(parseTextResponse);

    return;
  }

  await backendRequest<string>(`/api/email/cargar-con-archivo/${id}`, {
    method: "POST",
    body: formData,
    parse: "text",
  });
}

export const uploadPdfAndSendEmail = sendResguardoEmailWithPdf;
