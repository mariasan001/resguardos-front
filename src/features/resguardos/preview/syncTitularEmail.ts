import { updateUsuarioEmail } from "@/lib/services/usuarios.service";
import type { AppUser, PreviewResguardoDraft } from "@/lib/types/api";
import { toUserOption } from "@/lib/utils/format";
import { patchPreviewResguardoDraft } from "@/lib/utils/resguardo-draft";
import { patchUpdatedUser } from "@/lib/utils/user-cache";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function patchUserEmail(neyemp: string, email: string): Promise<AppUser> {
  const updatedUser = await updateUsuarioEmail(neyemp, email);

  if (updatedUser.neyemp !== neyemp) {
    throw new Error(
      "La respuesta del usuario actualizado no coincide con el empleado solicitado.",
    );
  }

  if ((updatedUser.email ?? "").trim() !== email) {
    throw new Error("El correo actualizado no fue confirmado por el backend.");
  }

  patchUpdatedUser(updatedUser);
  return updatedUser;
}

/**
 * El PDF usa el correo del titular; el envío del backend usa el del usuario
 * que resguarda. Registramos el mismo correo visible en ambos para que
 * "Enviar por email" coincida con lo mostrado en pantalla.
 */
export async function syncEmailsForResguardoSend(draft: PreviewResguardoDraft) {
  const trimmedEmail = draft.usuarioTitularEmail?.trim() ?? "";

  if (!trimmedEmail) {
    throw new Error(
      "Ingresa el correo de envío antes de continuar. Debe estar registrado en el usuario.",
    );
  }

  if (!emailPattern.test(trimmedEmail)) {
    throw new Error("Ingresa un correo válido antes de continuar.");
  }

  if (!draft.usuarioTitularId) {
    throw new Error("No fue posible identificar al titular para actualizar su correo.");
  }

  if (!draft.usuarioResguardaId) {
    throw new Error(
      "No fue posible identificar al usuario que resguarda para registrar el correo de envío.",
    );
  }

  const updatedTitular = await patchUserEmail(draft.usuarioTitularId, trimmedEmail);
  const updatedResguarda = await patchUserEmail(
    draft.usuarioResguardaId,
    trimmedEmail,
  );

  const titularOption = toUserOption(updatedTitular);
  const resguardaOption = toUserOption(updatedResguarda);
  const confirmedEmail =
    updatedResguarda.email?.trim() ||
    updatedTitular.email?.trim() ||
    trimmedEmail;

  patchPreviewResguardoDraft({
    usuarioTitularLabel: titularOption.label,
    usuarioTitularHelper: titularOption.helper,
    usuarioTitularEmail: confirmedEmail,
    usuarioResguardaLabel: resguardaOption.label,
    usuarioResguardaHelper: resguardaOption.helper,
  });

  return confirmedEmail;
}

/** @deprecated Prefer syncEmailsForResguardoSend */
export async function syncTitularEmailIfNeeded(draft: PreviewResguardoDraft) {
  return syncEmailsForResguardoSend(draft);
}
