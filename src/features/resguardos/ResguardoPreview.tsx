"use client";

import { CheckCircle2, PenLine } from "lucide-react";

import ResguardoSummary from "@/features/resguardos/ResguardoSummary";
import ResguardoVerificationCard from "@/features/resguardos/ResguardoVerificationCard";
import styles from "@/features/resguardos/ResguardoPreview.module.css";

import ResguardoPreviewPdfCard from "./preview/ResguardoPreviewPdfCard";
import ResguardoPreviewStatusCard from "./preview/ResguardoPreviewStatusCard";
import { useResguardoPreviewController } from "./preview/useResguardoPreviewController";

interface ResguardoPreviewProps {
  usuarioModifica?: string;
}

export default function ResguardoPreview({
  usuarioModifica,
}: ResguardoPreviewProps) {
  const {
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
  } = useResguardoPreviewController({ usuarioModifica });

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

  return (
    <ResguardoSummary
      hero={summary?.hero}
      sections={summary?.sections ?? []}
      accessories={summary?.accessories}
      footer={
        <>
          <ResguardoVerificationCard
            key={`verification-${draft.editingResguardoId ?? "new"}-${editSignatureMode}`}
            titular={draft.usuarioTitularLabel.trim() || "—"}
            titularEmail={draft.usuarioTitularEmail}
            initialSignatureDataUrl={draft.signatureDataUrl}
            initialSignatureValidated={Boolean(draft.signatureDataUrl)}
            confirmationPending={confirmationPending}
            readOnly={isReadOnlyFlow}
            signatureLocked={editSignatureMode === "saved"}
            signatureChoice={
              draft.editingResguardoId && !isReadOnlyFlow ? (
                <div
                  className={styles.signatureModes}
                  role="group"
                  aria-label="Firma a utilizar"
                >
                  <button
                    type="button"
                    className={styles.signatureMode}
                    data-active={editSignatureMode === "saved"}
                    disabled={
                      savedEditSignatureLoading ||
                      !savedEditSignature ||
                      confirmationPending
                    }
                    title={
                      savedEditSignatureLoading
                        ? "Consultando la firma registrada..."
                        : savedEditSignature
                          ? "Conservar la firma registrada"
                          : "Este resguardo no tiene firma registrada"
                    }
                    onClick={useSavedSignature}
                  >
                    <CheckCircle2 size={15} strokeWidth={1.9} />
                    Firma guardada
                  </button>

                  <button
                    type="button"
                    className={styles.signatureMode}
                    data-active={editSignatureMode === "new"}
                    disabled={confirmationPending}
                    title="Reemplazar la firma registrada"
                    onClick={registerNewSignature}
                  >
                    <PenLine size={15} strokeWidth={1.9} />
                    Nueva firma
                  </button>
                </div>
              ) : null
            }
            onTitularEmailChange={handleTitularEmailChange}
            onSignatureValidated={handleSignatureValidated}
            onReceptionConfirmed={handleReceptionConfirmed}
          />

          {shouldShowStatusCard && statusMessage ? (
            <ResguardoPreviewStatusCard
              submissionStage={submissionStage}
              statusMessage={statusMessage}
              signatureRetry={signatureRetry}
              confirmationPending={confirmationPending}
              onRetrySignatureUpload={handleRetrySignatureUpload}
            />
          ) : null}

          {generatedResguardoId ? (
            <ResguardoPreviewPdfCard
              pdfCardRef={pdfCardRef}
              generatedPdf={generatedPdf}
              pdfPreviewPending={pdfPreviewPending}
              pdfPreviewError={pdfPreviewError}
              emailPending={emailPending}
              onDownload={handleDownloadGeneratedPdf}
              onSendEmail={handleSendGeneratedPdf}
              onRetryPreview={handleRetryPdfPreview}
            />
          ) : null}
        </>
      }
    />
  );
}
