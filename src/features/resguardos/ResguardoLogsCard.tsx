"use client";

import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  PenLine,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

import type { ResguardoLog } from "@/lib/types/api";
import { formatDate, getEstadoLabel } from "@/lib/utils/format";
import styles from "@/features/resguardos/ResguardoLogsCard.module.css";

const PREVIEW_COUNT = 2;

const FIELD_LABELS: Record<string, string> = {
  ip: "IP",
  marca: "Marca",
  idInventario: "Inventario",
  fechaAsignacion: "Fecha de asignación",
  resguardo: "Referencia interna",
  observaciones: "Observaciones",
  observacionesBaja: "Observaciones de baja",
  usuarioResguarda: "Quien resguarda",
  usuarioAsigna: "Quien asigna",
  usuarioTitular: "Titular",
  fechaDevolucion: "Fecha de devolución",
  idEstadoResguardo: "Estado",
  telefono: "Teléfono",
  sistemaOperativo: "Sistema operativo",
  tipoBien: "Tipo de bien",
  modelo: "Modelo",
  numeroSerie: "Número de serie",
  mac: "MAC",
  colorMaterial: "Color / material",
  procesador: "Procesador",
  firmaPath: "Firma",
};

function isEmptyValue(value?: string | null) {
  return value === null || value === undefined || !String(value).trim();
}

function isFirmaField(campo?: string) {
  return campo?.trim() === "firmaPath";
}

function isFirmaEvent(tipoEvento?: string) {
  return tipoEvento?.trim().toUpperCase() === "FIRMA";
}

function formatFieldLabel(campo?: string) {
  if (!campo?.trim()) {
    return "Campo";
  }

  return FIELD_LABELS[campo] ?? campo;
}

function formatFirmaSummary(
  valorAnterior?: string | null,
  valorNuevo?: string | null,
) {
  if (isEmptyValue(valorAnterior) && !isEmptyValue(valorNuevo)) {
    return "Se registró la firma digital.";
  }

  if (!isEmptyValue(valorAnterior) && !isEmptyValue(valorNuevo)) {
    return "Se reemplazó la firma digital.";
  }

  if (!isEmptyValue(valorAnterior) && isEmptyValue(valorNuevo)) {
    return "Se eliminó la firma digital.";
  }

  return "Cambio en la firma.";
}

function formatLogValue(campo: string | undefined, value?: string | null) {
  if (isEmptyValue(value)) {
    return "Sin valor";
  }

  const text = String(value).trim();

  if (campo === "idEstadoResguardo") {
    const estado = Number(text);
    return Number.isInteger(estado) ? getEstadoLabel(estado) : text;
  }

  if (isFirmaField(campo)) {
    return text.split(/[/\\]/).pop() || "Archivo de firma";
  }

  return text;
}

function isFirmaLog(log: ResguardoLog) {
  return isFirmaEvent(log.tipoEvento) || isFirmaField(log.campo);
}

function eventTone(log: ResguardoLog) {
  if (isFirmaLog(log)) {
    return "info";
  }

  const normalized = log.tipoEvento?.trim().toUpperCase();
  if (normalized === "ACTUALIZACION" || normalized === "ACTUALIZACIÓN") {
    return "warning";
  }

  return "neutral";
}

function eventLabel(log: ResguardoLog) {
  if (isFirmaLog(log)) {
    return "Firma";
  }

  const normalized = log.tipoEvento?.trim().toUpperCase();
  if (normalized === "ACTUALIZACION" || normalized === "ACTUALIZACIÓN") {
    return "Actualización";
  }

  return log.tipoEvento?.trim() || "Evento";
}

function buildChangeSummary(log: ResguardoLog) {
  if (isFirmaLog(log)) {
    return {
      kind: "firma" as const,
      title: "Firma",
      summary: formatFirmaSummary(log.valorAnterior, log.valorNuevo),
    };
  }

  return {
    kind: "change" as const,
    title: formatFieldLabel(log.campo),
    from: formatLogValue(log.campo, log.valorAnterior),
    to: formatLogValue(log.campo, log.valorNuevo),
  };
}

interface ResguardoLogsCardProps {
  logs: ResguardoLog[];
  errorMessage?: string | null;
}

export default function ResguardoLogsCard({
  logs,
  errorMessage,
}: ResguardoLogsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const canToggle = logs.length > PREVIEW_COUNT;
  const visibleLogs =
    expanded || !canToggle ? logs : logs.slice(0, PREVIEW_COUNT);
  const hiddenCount = Math.max(logs.length - PREVIEW_COUNT, 0);

  return (
    <section className={styles.card} aria-labelledby="resguardo-logs-title">
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <span className={styles.iconWrap} aria-hidden="true">
            <History size={16} strokeWidth={1.9} />
          </span>
          <div>
            <h2 id="resguardo-logs-title" className={styles.title}>
              Actividad reciente
            </h2>
            <p className={styles.description}>
              {canToggle && !expanded
                ? "Últimos 2 movimientos del resguardo"
                : "Historial de cambios y firmas"}
            </p>
          </div>
        </div>

        <span className={styles.countBadge}>{logs.length}</span>
      </header>

      {errorMessage ? (
        <p className={styles.empty} role="status">
          {errorMessage}
        </p>
      ) : logs.length === 0 ? (
        <p className={styles.empty} role="status">
          Sin actividad registrada todavía.
        </p>
      ) : (
        <>
          <ol className={styles.timeline} data-expanded={expanded || undefined}>
            {visibleLogs.map((log, index) => {
              const change = buildChangeSummary(log);
              const tone = eventTone(log);
              const actor = log.usuarioModifica?.trim();
              const EventIcon = isFirmaLog(log) ? PenLine : RefreshCw;

              return (
                <li
                  key={log.id ?? `${log.campo}-${log.fechaCambio}-${index}`}
                  className={styles.item}
                  data-tone={tone}
                >
                  <span className={styles.rail} aria-hidden="true">
                    <span className={styles.node}>
                      <EventIcon size={13} strokeWidth={2.1} />
                    </span>
                  </span>

                  <div className={styles.content}>
                    <div className={styles.itemTop}>
                      <span className={styles.eventBadge} data-tone={tone}>
                        {eventLabel(log)}
                      </span>
                      <time className={styles.date} dateTime={log.fechaCambio}>
                        {formatDate(log.fechaCambio)}
                      </time>
                    </div>

                    <p className={styles.field}>{change.title}</p>

                    {change.kind === "firma" ? (
                      <p className={styles.summary}>{change.summary}</p>
                    ) : (
                      <div className={styles.change}>
                        <span className={styles.chip}>{change.from}</span>
                        <ArrowRight
                          size={13}
                          strokeWidth={2.2}
                          className={styles.arrow}
                          aria-hidden="true"
                        />
                        <span className={styles.chip} data-tone="new">
                          {change.to}
                        </span>
                      </div>
                    )}

                    {actor ? <p className={styles.actor}>{actor}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {canToggle ? (
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
            >
              <span className={styles.toggleLabel}>
                {expanded
                  ? "Ocultar historial"
                  : `Ver historial completo · ${hiddenCount} más`}
              </span>
              {expanded ? (
                <ChevronUp size={15} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
              )}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
