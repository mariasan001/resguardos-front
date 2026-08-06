import { ApiError } from "@/lib/api/errors";
import { getAccesoriosCatalog } from "@/lib/services/catalogos.client";
import {
  getResguardoById,
  getResguardoFirma,
} from "@/lib/services/resguardos.service";
import { generateResguardoPdf } from "@/lib/services/resguardo-pdf.service";
import { blobToDataUrl } from "@/lib/utils/file";
import { mapResguardoToPreviewDraft } from "@/lib/utils/resguardo-payload";

export async function buildPdfFileForResguardo(resguardoId: number) {
  const [resguardo, accesoriosCatalogo] = await Promise.all([
    getResguardoById(resguardoId),
    getAccesoriosCatalog(),
  ]);
  let signature: string | undefined;

  try {
    const blob = await getResguardoFirma(resguardoId);
    signature = await blobToDataUrl(blob);
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 410)) {
      throw error;
    }
  }

  const draft = mapResguardoToPreviewDraft(resguardo, signature);

  return generateResguardoPdf({
    createdResguardoId: resguardoId,
    draft,
    resguardo,
    accesoriosCatalogo,
  });
}
