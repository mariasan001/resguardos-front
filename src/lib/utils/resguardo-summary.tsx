import { Cpu, FileText, MapPinHouse, UserRound } from "lucide-react";

import type {
  PreviewResguardoDraft,
  Resguardo,
} from "@/lib/types/api";
import {
  formatDate,
  formatText,
  getEstadoLabel,
} from "@/lib/utils/format";
import type { ResguardoSummarySection } from "@/features/resguardos/ResguardoSummary";

const EMPTY_VALUE = "\u2014";
const ACCESSORY_SEPARATOR = " · Serie: ";

function formatValue(value?: string, fallback = EMPTY_VALUE) {
  return value?.trim() ? value : fallback;
}

function getDraftReferenciaInterna(draft: PreviewResguardoDraft) {
  return draft.referenciaInterna || draft.resguardo || "";
}

export function buildDraftSummarySections(
  draft: PreviewResguardoDraft,
): ResguardoSummarySection[] {
  const accesorios = draft.detalles.length
    ? draft.detalles.map((detalle, index) => ({
        label: `Accesorio ${index + 1}`,
        value: `${formatValue(detalle.accesorioLabel)}${ACCESSORY_SEPARATOR}${formatValue(
          detalle.numeroSerie,
          EMPTY_VALUE,
        )}`,
      }))
    : [{ label: "Accesorios", value: EMPTY_VALUE }];

  return [
    {
      title: "Datos del equipo",
      icon: <FileText size={16} strokeWidth={1.9} />,
      items: [
        { label: "Inventario", value: formatValue(draft.idInventario) },
        { label: "Marca", value: formatValue(draft.marca) },
        {
          label: "Fecha de asignacion",
          value: draft.fechaAsignacion ? formatDate(draft.fechaAsignacion) : EMPTY_VALUE,
        },
        { label: "Tipo de bien", value: formatValue(draft.tipoBienLabel) },
        { label: "Modelo", value: formatValue(draft.modeloLabel) },
        { label: "Numero de serie", value: formatValue(draft.numeroSerie) },
        { label: "Estado", value: formatValue(draft.estadoLabel) },
      ],
    },
    {
      title: "Especificaciones tecnicas",
      icon: <Cpu size={16} strokeWidth={1.9} />,
      items: [
        {
          label: "Sistema operativo",
          value: formatValue(draft.sistemaOperativoLabel),
        },
        {
          label: "Color / material",
          value: formatValue(draft.colorMaterialLabel),
        },
        { label: "Procesador", value: formatValue(draft.procesadorLabel) },
        { label: "IP", value: formatValue(draft.ip) },
        { label: "MAC", value: formatValue(draft.mac) },
      ],
    },
    {
      title: "Responsable y titular",
      icon: <UserRound size={16} strokeWidth={1.9} />,
      items: [
        {
          label: "Titular",
          value: formatValue(draft.usuarioTitularLabel),
          secondary: draft.usuarioTitularHelper?.trim() || undefined,
        },
        {
          label: "Resguarda",
          value: formatValue(draft.usuarioResguardaLabel),
          secondary: draft.usuarioResguardaHelper?.trim() || undefined,
        },
        {
          label: "Asigna",
          value: formatValue(draft.usuarioAsignaLabel),
          secondary: draft.usuarioAsignaHelper?.trim() || undefined,
        },
      ],
      columns: 1,
    },
    {
      title: "Ubicacion y control",
      icon: <MapPinHouse size={16} strokeWidth={1.9} />,
      items: [
        {
          label: "Referencia interna",
          value: formatValue(getDraftReferenciaInterna(draft)),
        },
        { label: "Telefono", value: formatValue(draft.telefono) },
        { label: "Observaciones", value: formatValue(draft.observaciones) },
      ],
    },
    {
      title: "Accesorios",
      icon: <FileText size={16} strokeWidth={1.9} />,
      items: accesorios,
      columns: 1,
    },
  ];
}

export function buildResguardoSummarySections(
  resguardo: Resguardo,
): ResguardoSummarySection[] {
  const accesorios = resguardo.detalles?.length
    ? resguardo.detalles.map((detalle, index) => ({
        label: `Accesorio ${index + 1}`,
        value: `${formatValue(detalle.accesorio?.descAccesorio)}${ACCESSORY_SEPARATOR}${formatValue(
          detalle.numeroSerie,
        )}`,
      }))
    : [{ label: "Accesorios", value: EMPTY_VALUE }];

  return [
    {
      title: "Datos del equipo",
      icon: <FileText size={16} strokeWidth={1.9} />,
      items: [
        { label: "Inventario", value: formatValue(resguardo.idInventario) },
        { label: "Marca", value: formatValue(resguardo.marca) },
        {
          label: "Fecha de asignacion",
          value: resguardo.fechaAsignacion
            ? formatDate(resguardo.fechaAsignacion)
            : EMPTY_VALUE,
        },
        {
          label: "Tipo de bien",
          value: formatText(resguardo.tipoBien?.descTipoBien, EMPTY_VALUE),
        },
        { label: "Modelo", value: formatText(resguardo.modelo?.descModelo, EMPTY_VALUE) },
        { label: "Numero de serie", value: formatValue(resguardo.numeroSerie) },
        {
          label: "Estado",
          value: getEstadoLabel(resguardo.idEstadoResguardo),
        },
      ],
    },
    {
      title: "Especificaciones tecnicas",
      icon: <Cpu size={16} strokeWidth={1.9} />,
      items: [
        {
          label: "Sistema operativo",
          value: formatText(resguardo.sistemaOperativo?.descSo, EMPTY_VALUE),
        },
        {
          label: "Color / material",
          value: formatText(resguardo.colorMaterial?.descMaterial, EMPTY_VALUE),
        },
        {
          label: "Procesador",
          value: formatText(resguardo.procesador?.descProcesador, EMPTY_VALUE),
        },
        { label: "IP", value: formatValue(resguardo.ip) },
        { label: "MAC", value: formatValue(resguardo.mac) },
      ],
    },
    {
      title: "Responsable y titular",
      icon: <UserRound size={16} strokeWidth={1.9} />,
      items: [
        {
          label: "Titular",
          value: formatText(resguardo.usuarioTitular?.nombre, EMPTY_VALUE),
          secondary:
            [resguardo.usuarioTitular?.neyemp, resguardo.usuarioTitular?.email]
              .filter(Boolean)
              .join(" · ") || undefined,
        },
        {
          label: "Resguarda",
          value: formatText(resguardo.usuarioResguarda?.nombre, EMPTY_VALUE),
          secondary: resguardo.usuarioResguarda?.neyemp?.trim() || undefined,
        },
        {
          label: "Asigna",
          value: formatText(resguardo.usuarioAsigna?.nombre, EMPTY_VALUE),
          secondary: resguardo.usuarioAsigna?.neyemp?.trim() || undefined,
        },
      ],
      columns: 1,
    },
    {
      title: "Ubicacion y control",
      icon: <MapPinHouse size={16} strokeWidth={1.9} />,
      items: [
        { label: "Referencia interna", value: formatValue(resguardo.resguardo) },
        { label: "Telefono", value: formatValue(resguardo.telefono) },
        { label: "Observaciones", value: formatValue(resguardo.observaciones) },
      ],
    },
    {
      title: "Accesorios",
      icon: <FileText size={16} strokeWidth={1.9} />,
      items: accesorios,
      columns: 1,
    },
  ];
}
