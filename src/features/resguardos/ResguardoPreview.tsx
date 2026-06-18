"use client";

import { Download, Mail } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import ResguardoSummary from "@/features/resguardos/ResguardoSummary";
import ResguardoVerificationCard from "@/features/resguardos/ResguardoVerificationCard";
import { getApiErrorMessage } from "@/lib/api/errors";
import { sendResguardoEmailWithPdf } from "@/lib/services/email.service";
import {
  createResguardo,
  getResguardoById,
  getResguardoFirma,
  uploadResguardoFirma,
} from "@/lib/services/resguardos.service";
import { generateResguardoPdf } from "@/lib/services/resguardo-pdf.service";
import { updateUsuarioEmail } from "@/lib/services/usuarios.service";
import { toUserOption } from "@/lib/utils/format";
import { blobToDataUrl, dataUrlToFile } from "@/lib/utils/file";
import { notify } from "@/lib/utils/notify";
import { patchPreviewResguardoDraft } from "@/lib/utils/resguardo-draft";
import {
  extractCreatedResguardoId,
  mapPreviewDraftToResguardoPayload,
  mapResguardoToPreviewDraft,
} from "@/lib/utils/resguardo-payload";
import { buildDraftSummarySections } from "@/lib/utils/resguardo-summary";
import { patchUpdatedUser } from "@/lib/utils/user-cache";
import {
  useIsHydrated,
  usePreviewResguardoDraft,
} from "@/lib/utils/use-preview-resguardo-draft";
import type { PreviewResguardoDraft } from "@/lib/types/api";
import styles from "@/features/resguardos/ResguardoPreview.module.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmissionStage =
  | "idle"
  | "saving_resguardo"
  | "uploading_firma"
  | "success"
  | "signature_error";

interface SignatureRetryState {
  createdResguardoId: number;
  signatureFile: File;
}

interface GeneratedPdfState {
  blob: Blob;
  file: File;
  filename: string;
  url: string;
  resguardoId: number;
}

async function syncTitularEmailIfNeeded(draft: PreviewResguardoDraft) {
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

export default function ResguardoPreview() {
  const hydrated = useIsHydrated();
  const draft = usePreviewResguardoDraft();
  const pdfCardRef = useRef<HTMLElement | null>(null);
  const autoPreparedPdfIdRef = useRef<number | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<SubmissionStage>("idle");
  const [signatureRetry, setSignatureRetry] = useState<SignatureRetryState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generatedPdf, setGeneratedPdf] = useState<GeneratedPdfState | null>(null);
  const [pdfPreviewPending, setPdfPreviewPending] = useState(false);
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
  const [emailPending, setEmailPending] = useState(false);

  const summarySections = useMemo(
    () => (draft ? buildDraftSummarySections(draft) : []),
    [draft],
  );

  useEffect(() => {
    return () => {
      if (generatedPdf?.url) {
        URL.revokeObjectURL(generatedPdf.url);
      }
    };
  }, [generatedPdf]);

  useEffect(() => {
    if (!generatedPdf || !pdfCardRef.current) {
      return;
    }

    window.requestAnimationFrame(() => {
      pdfCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [generatedPdf]);

  const prepareGeneratedPdfOnResume = useEffectEvent((resguardoId: number) => {
    autoPreparedPdfIdRef.current = resguardoId;
    void prepareGeneratedPdf(resguardoId).catch(() => undefined);
  });

  useEffect(() => {
    if (!draft?.createdResguardoId) {
      autoPreparedPdfIdRef.current = null;
      return;
    }

    if (generatedPdf?.resguardoId === draft.createdResguardoId) {
      return;
    }

    if (autoPreparedPdfIdRef.current === draft.createdResguardoId) {
      return;
    }

    prepareGeneratedPdfOnResume(draft.createdResguardoId);
  }, [draft?.createdResguardoId, generatedPdf?.resguardoId]);

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

  const currentDraft = draft;
  const generatedResguardoId = currentDraft.createdResguardoId;
  const isReadOnlyFlow = Boolean(generatedResguardoId) || submissionStage === "signature_error";

  function replaceGeneratedPdf(nextPdf: GeneratedPdfState | null) {
    setGeneratedPdf((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }

      return nextPdf;
    });
  }

  async function prepareGeneratedPdf(resguardoId: number) {
    setPdfPreviewPending(true);
    setPdfPreviewError(null);

    try {
      const resguardo = await getResguardoById(resguardoId);
      const signatureBlob = await getResguardoFirma(resguardoId);
      const signatureDataUrl = await blobToDataUrl(signatureBlob);
      const nextDraft = mapResguardoToPreviewDraft(resguardo, signatureDataUrl);
      const pdf = await generateResguardoPdf({
        createdResguardoId: resguardoId,
        draft: nextDraft,
        resguardo,
      });

      replaceGeneratedPdf({
        ...pdf,
        resguardoId,
        url: URL.createObjectURL(pdf.blob),
      });
    } catch (error) {
      replaceGeneratedPdf(null);
      setPdfPreviewError(
        getApiErrorMessage(
          error,
          "No fue posible preparar la vista previa del PDF del resguardo.",
        ),
      );
      throw error;
    } finally {
      setPdfPreviewPending(false);
    }
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

  async function handleRetrySignatureUpload() {
    if (!signatureRetry) {
      return;
    }

    setConfirmationPending(true);
    setSubmissionStage("uploading_firma");
    setStatusMessage(
      `Subiendo la firma del resguardo ${signatureRetry.createdResguardoId}...`,
    );

    try {
      await uploadResguardoFirma(
        signatureRetry.createdResguardoId,
        signatureRetry.signatureFile,
      );

      setSignatureRetry(null);
      setSubmissionStage("success");
      setStatusMessage(
        `El resguardo ${signatureRetry.createdResguardoId} ya esta listo. Revisa el PDF antes de descargarlo o enviarlo.`,
      );

      try {
        await prepareGeneratedPdf(signatureRetry.createdResguardoId);
      } catch {
        setStatusMessage(
          `El resguardo ${signatureRetry.createdResguardoId} fue generado, pero la vista previa del PDF no pudo cargarse todavia.`,
        );
      }
    } catch (error) {
      setSubmissionStage("signature_error");
      setStatusMessage(
        "El resguardo ya fue registrado, pero la firma sigue pendiente de carga.",
      );

      notify.error(
        "No fue posible subir la firma",
        getApiErrorMessage(
          error,
          "La firma del resguardo no pudo registrarse. Puedes reintentar sin duplicar el resguardo.",
        ),
      );
    } finally {
      setConfirmationPending(false);
    }
  }

  async function handleReceptionConfirmed() {
    if (!currentDraft.signatureDataUrl) {
      notify.warning(
        "Firma pendiente",
        "Confirma la firma del titular antes de guardar el resguardo.",
      );
      return;
    }

    setConfirmationPending(true);
    setSignatureRetry(null);
    setSubmissionStage("saving_resguardo");
    setStatusMessage("Guardando el resguardo...");
    setPdfPreviewError(null);

    try {
      const syncedEmail = await syncTitularEmailIfNeeded(currentDraft);
      const signatureFile = await dataUrlToFile(
        currentDraft.signatureDataUrl,
        "firma-resguardo.png",
      );

      const createdResponse = await createResguardo(
        mapPreviewDraftToResguardoPayload(currentDraft),
      );
      const createdResguardoId = extractCreatedResguardoId(createdResponse);

      patchPreviewResguardoDraft({
        createdResguardoId,
        usuarioTitularEmail: syncedEmail || currentDraft.usuarioTitularEmail,
      });

      setSubmissionStage("uploading_firma");
      setStatusMessage(`Subiendo la firma del resguardo ${createdResguardoId}...`);

      try {
        await uploadResguardoFirma(createdResguardoId, signatureFile);

        setSubmissionStage("success");
        setStatusMessage(
          `El resguardo ${createdResguardoId} fue generado correctamente. Revisa el PDF antes de descargarlo o enviarlo.`,
        );

        try {
          await prepareGeneratedPdf(createdResguardoId);
        } catch {
          setStatusMessage(
            `El resguardo ${createdResguardoId} fue generado, pero la vista previa del PDF no pudo cargarse todavia.`,
          );
        }
      } catch (error) {
        setSignatureRetry({
          createdResguardoId,
          signatureFile,
        });
        setSubmissionStage("signature_error");
        setStatusMessage(
          `El resguardo ${createdResguardoId} fue registrado, pero no se pudo subir la firma.`,
        );

        notify.warning(
          "Firma pendiente de carga",
          getApiErrorMessage(
            error,
            "El resguardo fue registrado, pero no se pudo subir la firma.",
          ),
        );
      }
    } catch (error) {
      setSubmissionStage("idle");
      setStatusMessage(null);

      notify.error(
        "No fue posible completar el resguardo",
        getApiErrorMessage(error, "Ocurrio un error al registrar el resguardo."),
      );
    } finally {
      setConfirmationPending(false);
    }
  }

  function handleDownloadGeneratedPdf() {
    if (!generatedPdf) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = generatedPdf.url;
    anchor.download = generatedPdf.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function handleSendGeneratedPdf() {
    if (!generatedPdf) {
      return;
    }

    setEmailPending(true);
    const toastId = notify.loading(
      "Enviando resguardo",
      "Adjuntando el PDF generado al correo del resguardo...",
    );

    try {
      await sendResguardoEmailWithPdf(generatedPdf.resguardoId, generatedPdf.file);
      notify.dismiss(toastId);
      notify.success(
        "Correo enviado",
        `El PDF del resguardo ${generatedPdf.resguardoId} fue enviado correctamente.`,
      );
    } catch (error) {
      notify.dismiss(toastId);
      notify.error(
        "No fue posible enviar por email",
        getApiErrorMessage(
          error,
          "No fue posible enviar el PDF del resguardo por correo.",
        ),
      );
    } finally {
      setEmailPending(false);
    }
  }

  async function handleRetryPdfPreview() {
    if (!generatedResguardoId || pdfPreviewPending) {
      return;
    }

    await prepareGeneratedPdf(generatedResguardoId).catch(() => undefined);
  }

  const statusToneClass =
    submissionStage === "success"
      ? styles.statusCardSuccess
      : submissionStage === "signature_error"
        ? styles.statusCardError
        : styles.statusCardInfo;
  const shouldShowStatusCard = Boolean(
    statusMessage && !(submissionStage === "success" && generatedResguardoId),
  );

  return (
    <ResguardoSummary
      sections={summarySections}
      footer={
        <>
          <ResguardoVerificationCard
            titular={draft.usuarioTitularLabel.trim() || "—"}
            titularEmail={currentDraft.usuarioTitularEmail}
            initialSignatureDataUrl={currentDraft.signatureDataUrl}
            initialSignatureValidated={Boolean(currentDraft.signatureDataUrl)}
            confirmationPending={confirmationPending}
            readOnly={isReadOnlyFlow}
            onTitularEmailChange={handleTitularEmailChange}
            onSignatureValidated={handleSignatureValidated}
            onReceptionConfirmed={handleReceptionConfirmed}
          />

          {shouldShowStatusCard ? (
            <section className={`${styles.statusCard} ${statusToneClass}`}>
              <div className={styles.statusCopy}>
                <h3 className={styles.statusTitle}>
                  {submissionStage === "saving_resguardo"
                    ? "Guardando resguardo"
                    : submissionStage === "uploading_firma"
                      ? "Subiendo firma"
                      : submissionStage === "success"
                        ? "Resguardo generado"
                        : "Firma pendiente"}
                </h3>
                <p className={styles.statusText}>{statusMessage}</p>
              </div>

              {signatureRetry ? (
                <div className={styles.statusActions}>
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={handleRetrySignatureUpload}
                    disabled={confirmationPending}
                  >
                    {confirmationPending ? "Reintentando..." : "Reintentar firma"}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {generatedResguardoId ? (
            <section ref={pdfCardRef} className={styles.pdfCard}>
              <div className={styles.pdfHeader}>
                <div className={styles.pdfCopy}>
                  <h3 className={styles.pdfTitle}>Vista previa del PDF</h3>
                  <p className={styles.pdfText}>
                    Revisa el formato generado del resguardo antes de descargarlo o enviarlo.
                  </p>
                </div>

                <div className={styles.pdfActions}>
                  <button
                    type="button"
                    className={styles.downloadPdfButton}
                    onClick={handleDownloadGeneratedPdf}
                    disabled={!generatedPdf || pdfPreviewPending}
                  >
                    <Download size={15} strokeWidth={1.9} />
                    Descargar PDF
                  </button>

                  <button
                    type="button"
                    className={styles.primaryPdfButton}
                    onClick={handleSendGeneratedPdf}
                    disabled={!generatedPdf || pdfPreviewPending || emailPending}
                  >
                    <Mail size={15} strokeWidth={1.9} />
                    {emailPending ? "Enviando..." : "Enviar por email"}
                  </button>
                </div>
              </div>

              {pdfPreviewPending ? (
                <div className={styles.pdfState}>
                  <p className={styles.pdfStateTitle}>Generando vista previa...</p>
                  <p className={styles.pdfStateText}>
                    Preparando el PDF del resguardo con la firma registrada.
                  </p>
                </div>
              ) : generatedPdf ? (
                <div className={styles.pdfPreviewFrame}>
                  <iframe
                    className={styles.pdfPreview}
                    title={`Vista previa del resguardo ${generatedPdf.resguardoId}`}
                    src={generatedPdf.url}
                  />
                </div>
              ) : (
                <div className={styles.pdfState}>
                  <p className={styles.pdfStateTitle}>No se pudo mostrar el PDF</p>
                  <p className={styles.pdfStateText}>
                    {pdfPreviewError ?? "Vuelve a intentarlo para generar la vista previa."}
                  </p>
                  <div className={styles.pdfStateActions}>
                    <button
                      type="button"
                      className={styles.retryButton}
                      onClick={handleRetryPdfPreview}
                      disabled={pdfPreviewPending}
                    >
                      Reintentar vista previa
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </>
      }
    />
  );
}
