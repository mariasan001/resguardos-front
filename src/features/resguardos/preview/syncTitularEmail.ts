import { updateUsuarioEmail } from "@/lib/services/usuarios.service";
import type { PreviewResguardoDraft } from "@/lib/types/api";
import { toUserOption } from "@/lib/utils/format";
import { patchPreviewResguardoDraft } from "@/lib/utils/resguardo-draft";
import { patchUpdatedUser } from "@/lib/utils/user-cache";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function syncTitularEmailIfNeeded(draft: PreviewResguardoDraft) {
  const trimmedEmail = draft.usuarioTitularEmail?.trim() ?? "";

  if (!trimmedEmail) {
    return draft.usuarioTitularEmail;
  }

  if (!emailPattern.test(trimmedEmail)) {
    throw new Error(
      "Ingresa un correo valido para el titular antes de confirmar la recepcion.",
    );
  }

  if (!draft.usuarioTitularId) {
    throw new Error("No fue posible identificar al titular para actualizar su correo.");
  }

  const updatedUser = await updateUsuarioEmail(draft.usuarioTitularId, trimmedEmail);

  if (updatedUser.neyemp !== draft.usuarioTitularId) {
    throw new Error(
      "La respuesta del usuario actualizado no coincide con el titular seleccionado.",
    );
  }

  if ((updatedUser.email ?? "").trim() !== trimmedEmail) {
    throw new Error("El correo actualizado no fue confirmado por el backend.");
  }

  const updatedUserOption = toUserOption(updatedUser);

  patchUpdatedUser(updatedUser);
  patchPreviewResguardoDraft({
    usuarioTitularLabel: updatedUserOption.label,
    usuarioTitularHelper: updatedUserOption.helper,
    usuarioTitularEmail: updatedUser.email ?? trimmedEmail,
  });

  return updatedUser.email ?? trimmedEmail;
}
