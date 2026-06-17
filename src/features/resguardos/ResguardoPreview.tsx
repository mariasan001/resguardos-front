"use client";

import { Cpu, FileText, MapPinHouse, UserRound } from "lucide-react";
import { useState } from "react";

import ResguardoReceiptCard from "@/features/resguardos/ResguardoReceiptCard";
import ResguardoVerificationCard from "@/features/resguardos/ResguardoVerificationCard";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createResguardo, getResguardoById } from "@/lib/services/resguardos.service";
import { generateResguardoPdf } from "@/lib/services/resguardo-pdf.service";
import { updateUsuarioEmail } from "@/lib/services/usuarios.service";
import { formatDate } from "@/lib/utils/format";
import { notify } from "@/lib/utils/notify";
import { patchPreviewResguardoDraft } from "@/lib/utils/resguardo-draft";
import {
  extractCreatedResguardoId,
  mapPreviewDraftToResguardoPayload,
} from "@/lib/utils/resguardo-payload";
import {
  useIsHydrated,
  usePreviewResguardoDraft,
} from "@/lib/utils/use-preview-resguardo-draft";
import styles from "@/features/resguardos/ResguardoPreview.module.css";

const EMPTY_VALUE = "\u2014";
const ACCESSORY_SEPARATOR = " \u00b7 Serie: ";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDraftValue(value?: string, fallback = EMPTY_VALUE) {
  return value?.trim() ? value : fallback;
}

interface PreviewSectionProps {
  title: string;
  icon: React.ReactNode;
  items: Array<{ label: string; value: string; secondary?: string }>;
  columns?: 1 | 2;
}

function PreviewSection({
  title,
  icon,
  items,
  columns = 2,
}: PreviewSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>

      <dl
        className={`${styles.definitionList} ${
          columns === 2 ? styles.definitionListTwoColumns : styles.definitionListOneColumn
        }`}
      >
        {items.map((item) => (
          <div key={item.label} className={styles.definitionRow}>
            <dt className={styles.definitionTerm}>{item.label}</dt>
            <dd className={styles.definitionValue}>
              <span>{item.value}</span>
              {item.secondary ? <small>{item.secondary}</small> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

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

  const accesorios = draft.detalles.length
    ? draft.detalles.map((detalle, index) => ({
        label: `Accesorio ${index + 1}`,
        value: `${formatDraftValue(detalle.accesorioLabel)}${ACCESSORY_SEPARATOR}${formatDraftValue(
          detalle.numeroSerie,
          EMPTY_VALUE,
        )}`,
      }))
    : [{ label: "Accesorios", value: EMPTY_VALUE }];

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

        await updateUsuarioEmail(draft.usuarioTitularId, trimmedEmail);

        patchPreviewResguardoDraft({
          usuarioTitularEmail: trimmedEmail,
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
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.recordCard}>
            <div className={styles.sections}>
              <PreviewSection
                title="Datos del equipo"
                icon={<FileText size={16} strokeWidth={1.9} />}
                items={[
                  { label: "Inventario", value: formatDraftValue(draft.idInventario) },
                  { label: "Marca", value: formatDraftValue(draft.marca) },
                  { label: "Folio", value: formatDraftValue(draft.resguardo) },
                  {
                    label: "Fecha de asignacion",
                    value: draft.fechaAsignacion
                      ? formatDate(draft.fechaAsignacion)
                      : EMPTY_VALUE,
                  },
                  { label: "Tipo de bien", value: formatDraftValue(draft.tipoBienLabel) },
                  { label: "Modelo", value: formatDraftValue(draft.modeloLabel) },
                  { label: "Numero de serie", value: formatDraftValue(draft.numeroSerie) },
                  { label: "Estado", value: formatDraftValue(draft.estadoLabel) },
                ]}
              />

              <PreviewSection
                title="Especificaciones tecnicas"
                icon={<Cpu size={16} strokeWidth={1.9} />}
                items={[
                  {
                    label: "Sistema operativo",
                    value: formatDraftValue(draft.sistemaOperativoLabel),
                  },
                  {
                    label: "Color / material",
                    value: formatDraftValue(draft.colorMaterialLabel),
                  },
                  { label: "Procesador", value: formatDraftValue(draft.procesadorLabel) },
                  { label: "IP", value: formatDraftValue(draft.ip) },
                  { label: "MAC", value: formatDraftValue(draft.mac) },
                ]}
              />

              <PreviewSection
                title="Responsable y titular"
                icon={<UserRound size={16} strokeWidth={1.9} />}
                items={[
                  {
                    label: "Titular",
                    value: formatDraftValue(draft.usuarioTitularLabel),
                    secondary: draft.usuarioTitularHelper?.trim() || undefined,
                  },
                  {
                    label: "Resguarda",
                    value: formatDraftValue(draft.usuarioResguardaLabel),
                    secondary: draft.usuarioResguardaHelper?.trim() || undefined,
                  },
                  {
                    label: "Asigna",
                    value: formatDraftValue(draft.usuarioAsignaLabel),
                    secondary: draft.usuarioAsignaHelper?.trim() || undefined,
                  },
                ]}
                columns={1}
              />

              <PreviewSection
                title="Ubicacion y control"
                icon={<MapPinHouse size={16} strokeWidth={1.9} />}
                items={[
                  { label: "Area / referencia", value: formatDraftValue(draft.resguardo) },
                  { label: "Telefono", value: formatDraftValue(draft.telefono) },
                  {
                    label: "Observaciones",
                    value: formatDraftValue(draft.observaciones),
                  },
                ]}
              />

              <PreviewSection
                title="Accesorios"
                icon={<FileText size={16} strokeWidth={1.9} />}
                items={accesorios}
                columns={1}
              />
            </div>
          </section>

          <ResguardoVerificationCard
            titular={formatDraftValue(draft.usuarioTitularLabel)}
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
        </div>
      </div>
    </div>
  );
}
