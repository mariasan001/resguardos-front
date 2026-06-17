"use client";

import { useState } from "react";

import ResguardoReceiptCard from "@/features/resguardos/ResguardoReceiptCard";
import ResguardoSummary from "@/features/resguardos/ResguardoSummary";
import ResguardoVerificationCard from "@/features/resguardos/ResguardoVerificationCard";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createResguardo, getResguardoById } from "@/lib/services/resguardos.service";
import { generateResguardoPdf } from "@/lib/services/resguardo-pdf.service";
import { updateUsuarioEmail } from "@/lib/services/usuarios.service";
import { toUserOption } from "@/lib/utils/format";
import { notify } from "@/lib/utils/notify";
import { patchPreviewResguardoDraft } from "@/lib/utils/resguardo-draft";
import {
  extractCreatedResguardoId,
  mapPreviewDraftToResguardoPayload,
} from "@/lib/utils/resguardo-payload";
import { writeResguardoSignature } from "@/lib/utils/resguardo-signature";
import { buildDraftSummarySections } from "@/lib/utils/resguardo-summary";
import { patchUpdatedUser } from "@/lib/utils/user-cache";
import {
  useIsHydrated,
  usePreviewResguardoDraft,
} from "@/lib/utils/use-preview-resguardo-draft";
import styles from "@/features/resguardos/ResguardoPreview.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ResguardoReceiptState {
  createdResguardoId: number;
  filename: string;
  pdfFile: File;
}

export default function ResguardoPreview() {
  const hydrated = useIsHydrated();
  const draft = usePreviewResguardoDraft();
  const [receipt, setReceipt] = useState<ResguardoReceiptState | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);

  if (!hydrated) {
    return <section className={styles.emptyState} aria-busy="true" />;
  }

  if (!draft) {
    return (
      <section className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>Aun no hay una previsualizacion</h2>
        <p className={styles.emptyText}>
          Captura la informacion del resguardo y usa Revisar resguardo para ver el
          formato.
        </p>
      </section>
    );
  }

  function handleSignatureValidated(signatureDataUrl: string) {
    patchPreviewResguardoDraft({
      signatureDataUrl,
    });
  }

  function handleTitularEmailChange(usuarioTitularEmail: string) {
    patchPreviewResguardoDraft({
      usuarioTitularEmail,
    });
  }

  async function handleReceptionConfirmed() {
    if (!draft?.signatureDataUrl) {
      notify.warning(
        "Firma pendiente",
        "Confirma la firma del titular antes de guardar el resguardo.",
      );
      return;
    }

    setConfirmationPending(true);

    try {
      const trimmedEmail = draft.usuarioTitularEmail?.trim() ?? "";

      if (trimmedEmail) {
        if (!emailPattern.test(trimmedEmail)) {
          notify.warning(
            "Correo invalido",
            "Ingresa un correo valido para el titular antes de confirmar la recepcion.",
          );
          return;
        }

        if (!draft.usuarioTitularId) {
          notify.warning(
            "Titular no disponible",
            "No fue posible identificar al titular para actualizar su correo.",
          );
          return;
        }

        const updatedUser = await updateUsuarioEmail(draft.usuarioTitularId, trimmedEmail);

        if (updatedUser.neyemp !== draft.usuarioTitularId) {
          throw new Error("La respuesta del usuario actualizado no coincide con el titular seleccionado.");
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
      }

      const createdResponse = await createResguardo(
        mapPreviewDraftToResguardoPayload(draft),
      );
      const createdResguardoId = extractCreatedResguardoId(createdResponse);

      if (!createdResguardoId) {
        throw new Error("No fue posible identificar el resguardo creado.");
      }

      const savedResguardo = await getResguardoById(createdResguardoId);
      const pdf = await generateResguardoPdf({
        createdResguardoId,
        draft,
        resguardo: savedResguardo,
      });

      patchPreviewResguardoDraft({
        createdResguardoId,
        usuarioTitularEmail: trimmedEmail || draft.usuarioTitularEmail,
      });

      if (draft.signatureDataUrl) {
        writeResguardoSignature(createdResguardoId, draft.signatureDataUrl);
      }

      setReceipt({
        createdResguardoId,
        filename: pdf.filename,
        pdfFile: pdf.file,
      });

      notify.success(
        "Resguardo registrado",
        `El resguardo ${createdResguardoId} fue guardado y el PDF ya esta listo.`,
      );
    } catch (error) {
      notify.error(
        "No fue posible completar el resguardo",
        getApiErrorMessage(error, "Ocurrio un error al guardar o generar el PDF."),
      );
    } finally {
      setConfirmationPending(false);
    }
  }

  return (
    <ResguardoSummary
      sections={buildDraftSummarySections(draft)}
      footer={
        <>
          <ResguardoVerificationCard
            titular={draft.usuarioTitularLabel.trim() || "—"}
            titularEmail={draft.usuarioTitularEmail}
            initialSignatureDataUrl={draft.signatureDataUrl}
            initialSignatureValidated={Boolean(draft.signatureDataUrl)}
            confirmationPending={confirmationPending}
            onTitularEmailChange={handleTitularEmailChange}
            onSignatureValidated={handleSignatureValidated}
            onReceptionConfirmed={handleReceptionConfirmed}
          />

          {receipt ? (
            <ResguardoReceiptCard
              createdResguardoId={receipt.createdResguardoId}
              filename={receipt.filename}
              pdfFile={receipt.pdfFile}
            />
          ) : null}
        </>
      }
    />
  );
}
