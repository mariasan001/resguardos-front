import { backendRequest } from "@/lib/api/backend-client";

export async function uploadPdfAndSendEmail(id: number, file: File) {
  const formData = new FormData();
  formData.append("archivo", file);

  return backendRequest<string>(`/api/email/cargar-con-archivo/${id}`, {
    method: "POST",
    body: formData,
    parse: "text",
  });
}
