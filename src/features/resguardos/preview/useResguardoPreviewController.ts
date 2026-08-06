"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getAccesoriosCatalog } from "@/lib/services/catalogos.client";
import { sendResguardoEmailWithPdf } from "@/lib/services/email.service";
import {
  createResguardo,
  getResguardoById,
  getResguardoFirma,
  updateResguardo,
  uploadResguardoFirma,
} from "@/lib/services/resguardos.service";
import { generateResguardoPdf } from "@/lib/services/resguardo-pdf.service";
import { blobToDataUrl, dataUrlToFile } from "@/lib/utils/file";
import { notify } from "@/lib/utils/notify";
import { patchPreviewResguardoDraft } from "@/lib/utils/resguardo-draft";
import {
  extractCreatedResguardoId,
  mapPreviewDraftToResguardoPayload,
  mapResguardoToPreviewDraft,
} from "@/lib/utils/resguardo-payload";
import { buildDraftSummary } from "@/lib/utils/resguardo-summary";
import {
  useIsHydrated,
  usePreviewResguardoDraft,
} from "@/lib/utils/use-preview-resguardo-draft";

import { syncTitularEmailIfNeeded } from "./syncTitularEmail";
import type {
  EditSignatureMode,
  GeneratedPdfState,
  SignatureRetryState,
  SubmissionStage,
} from "./types";

export function useResguardoPreviewController() {
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
  const [savedEditSignature, setSavedEditSignature] = useState<string | null>(null);
  const [savedEditSignatureLoading, setSavedEditSignatureLoading] = useState(true);
  const [editSignatureMode, setEditSignatureMode] =
    useState<EditSignatureMode>(draft?.editSignatureMode ?? "choose");

  const summary = useMemo(
    () => (draft ? buildDraftSummary(draft) : null),
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

  useEffect(() => {
    const editingResguardoId = draft?.editingResguardoId;

    if (!editingResguardoId) {
      return;
    }

    let cancelled = false;

    void getResguardoFirma(editingResguardoId)
      .then(blobToDataUrl)
      .then((signatureDataUrl) => {
        if (!cancelled) {
          setSavedEditSignature(signatureDataUrl);
          setSavedEditSignatureLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedEditSignature(null);
          setSavedEditSignatureLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draft?.editingResguardoId]);

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
      const accesoriosCatalogo = await getAccesoriosCatalog();
      const nextDraft = mapResguardoToPreviewDraft(resguardo, signatureDataUrl);
      const capturedDetalles = draft?.detalles ?? [];
      const pdf = await generateResguardoPdf({
        createdResguardoId: resguardoId,
        draft: capturedDetalles.length
          ? { ...nextDraft, detalles: capturedDetalles }
          : nextDraft,
        resguardo,
        accesoriosCatalogo,
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
    setEditSignatureMode("new");
    patchPreviewResguardoDraft({
      signatureDataUrl,
      editSignatureMode: "new",
    });
  }

  function useSavedSignature() {
    if (!savedEditSignature) {
      notify.warning(
        "Firma no disponible",
        "Este resguardo no tiene una firma guardada disponible.",
      );
      return;
    }

    setEditSignatureMode("saved");
    patchPreviewResguardoDraft({
      signatureDataUrl: savedEditSignature,
      editSignatureMode: "saved",
    });
  }

  function registerNewSignature() {
    setEditSignatureMode("new");
    patchPreviewResguardoDraft({
      signatureDataUrl: undefined,
      editSignatureMode: "new",
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
    if (!draft) {
      return;
    }

    if (!draft.signatureDataUrl) {
      notify.warning(
        "Firma pendiente",
        "Confirma la firma del titular antes de guardar el resguardo.",
      );
      return;
    }

    const editingResguardoId = draft.editingResguardoId;

    setConfirmationPending(true);
    setSignatureRetry(null);
    setSubmissionStage("saving_resguardo");
    setStatusMessage(
      editingResguardoId ? "Actualizando el resguardo..." : "Guardando el resguardo...",
    );
    setPdfPreviewError(null);

    try {
      const syncedEmail = await syncTitularEmailIfNeeded(draft);
      const signatureFile = await dataUrlToFile(
        draft.signatureDataUrl,
        "firma-resguardo.png",
      );

      const payload = mapPreviewDraftToResguardoPayload(draft);
      let createdResguardoId: number;

      if (editingResguardoId) {
        await updateResguardo(editingResguardoId, payload);
        createdResguardoId = editingResguardoId;
      } else {
        createdResguardoId = extractCreatedResguardoId(await createResguardo(payload));
      }

      patchPreviewResguardoDraft({
        createdResguardoId,
        usuarioTitularEmail: syncedEmail || draft.usuarioTitularEmail,
      });

      setSubmissionStage("uploading_firma");
      setStatusMessage(`Subiendo la firma del resguardo ${createdResguardoId}...`);

      try {
        await uploadResguardoFirma(createdResguardoId, signatureFile);

        setSubmissionStage("success");
        setStatusMessage(
          editingResguardoId
            ? `El resguardo ${createdResguardoId} fue actualizado correctamente. Revisa el PDF antes de descargarlo o enviarlo.`
            : `El resguardo ${createdResguardoId} fue generado correctamente. Revisa el PDF antes de descargarlo o enviarlo.`,
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
        editingResguardoId
          ? "No fue posible actualizar el resguardo"
          : "No fue posible completar el resguardo",
        getApiErrorMessage(
          error,
          editingResguardoId
            ? "Ocurrio un error al actualizar el resguardo."
            : "Ocurrio un error al registrar el resguardo.",
        ),
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
    const generatedResguardoId = draft?.createdResguardoId;

    if (!generatedResguardoId || pdfPreviewPending) {
      return;
    }

    await prepareGeneratedPdf(generatedResguardoId).catch(() => undefined);
  }

  const generatedResguardoId = draft?.createdResguardoId;
  const isReadOnlyFlow = Boolean(generatedResguardoId) || submissionStage === "signature_error";
  const shouldShowStatusCard = Boolean(
    statusMessage && !(submissionStage === "success" && generatedResguardoId),
  );

  return {
    hydrated,
    draft,
    summary,
    pdfCardRef,
    confirmationPending,
    submissionStage,
    signatureRetry,
    statusMessage,
    generatedPdf,
    pdfPreviewPending,
    pdfPreviewError,
    emailPending,
    savedEditSignature,
    savedEditSignatureLoading,
    editSignatureMode,
    generatedResguardoId,
    isReadOnlyFlow,
    shouldShowStatusCard,
    handleSignatureValidated,
    useSavedSignature,
    registerNewSignature,
    handleTitularEmailChange,
    handleRetrySignatureUpload,
    handleReceptionConfirmed,
    handleDownloadGeneratedPdf,
    handleSendGeneratedPdf,
    handleRetryPdfPreview,
  };
}
