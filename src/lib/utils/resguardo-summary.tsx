import { Cpu, FileText, MapPinHouse, UserRound } from "lucide-react";

import type {
  PreviewResguardoDraft,
  Resguardo,
} from "@/lib/types/api";
import { FIXED_ASSIGN_USER_NAME } from "@/lib/constants/assigner";
import {
  formatDate,
  formatText,
  getEstadoLabel,
  getMarcaLabel,
} from "@/lib/utils/format";
import type {
  EstadoTone,
  ResguardoAccessoryItem,
  ResguardoSummaryData,
} from "@/features/resguardos/ResguardoSummary";

const EMPTY_VALUE = "\u2014";

function formatValue(value?: string, fallback = EMPTY_VALUE) {
  return value?.trim() ? value : fallback;
}

function getDraftReferenciaInterna(draft: PreviewResguardoDraft) {
  return draft.referenciaInterna || draft.resguardo || "";
}

function getEstadoTone(estadoLabel: string): EstadoTone {
  switch (estadoLabel) {
    case "Entregado":
      return "success";
    case "Modificado":
      return "warning";
    case "Baja":
      return "danger";
    default:
      return "neutral";
  }
}

/** Une marca y modelo para describir el equipo en el encabezado. */
function buildEquipoLabel(...parts: Array<string | undefined>) {
  const label = parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return label || EMPTY_VALUE;
}

export function buildDraftSummary(
  draft: PreviewResguardoDraft,
): ResguardoSummaryData {
  const estadoLabel = formatValue(draft.estadoLabel, "Entregado");

  const accessories: ResguardoAccessoryItem[] = draft.detalles.map((detalle) => ({
    accesorio: formatValue(detalle.accesorioLabel),
    marca: formatValue(detalle.marcaLabel),
    modelo: formatValue(detalle.modeloLabel),
    numeroSerie: formatValue(detalle.numeroSerie),
  }));

  return {
    hero: {
      inventario: formatValue(draft.idInventario),
      estadoLabel,
      estadoTone: getEstadoTone(estadoLabel),
      equipo: buildEquipoLabel(draft.marca, draft.modeloLabel),
      titular: formatValue(draft.usuarioTitularLabel),
      titularHelper: draft.usuarioTitularHelper?.trim() || undefined,
      fechaAsignacion: draft.fechaAsignacion
        ? formatDate(draft.fechaAsignacion)
        : EMPTY_VALUE,
    },
    sections: [
      {
        title: "Datos del equipo",
        icon: <FileText size={16} strokeWidth={1.9} />,
        items: [
          { label: "Tipo de bien", value: formatValue(draft.tipoBienLabel) },
          { label: "Marca", value: formatValue(draft.marca) },
          { label: "Modelo", value: formatValue(draft.modeloLabel) },
          { label: "Numero de serie", value: formatValue(draft.numeroSerie) },
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
          { label: "Procesador", value: formatValue(draft.procesadorLabel) },
          {
            label: "Color / material",
            value: formatValue(draft.colorMaterialLabel),
          },
          { label: "IP", value: formatValue(draft.ip) },
          { label: "MAC", value: formatValue(draft.mac) },
        ],
      },
      {
        title: "Responsables",
        icon: <UserRound size={16} strokeWidth={1.9} />,
        items: [
          {
            label: "Resguarda",
            value: formatValue(draft.usuarioResguardaLabel),
            secondary: draft.usuarioResguardaHelper?.trim() || undefined,
          },
          {
            label: "Asigna",
            value: FIXED_ASSIGN_USER_NAME,
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
          {
            label: "Observaciones",
            value: formatValue(draft.observaciones),
            wide: true,
          },
        ],
      },
    ],
    accessories,
  };
}

export function buildResguardoSummary(
  resguardo: Resguardo,
): ResguardoSummaryData {
  const estadoLabel = getEstadoLabel(resguardo.idEstadoResguardo);

  const accessories: ResguardoAccessoryItem[] =
    resguardo.detalles?.map((detalle) => ({
      accesorio: formatValue(detalle.accesorio?.descAccesorio),
      marca: formatValue(getMarcaLabel(detalle.accesorio?.marca)),
      modelo: formatValue(detalle.accesorio?.modelo ?? undefined),
      numeroSerie: formatValue(detalle.numeroSerie),
    })) ?? [];

  return {
    hero: {
      inventario: formatValue(resguardo.idInventario),
      estadoLabel,
      estadoTone: getEstadoTone(estadoLabel),
      equipo: buildEquipoLabel(
        getMarcaLabel(resguardo.marca),
        resguardo.modelo?.descModelo,
      ),
      titular: formatText(resguardo.usuarioTitular?.nombre, EMPTY_VALUE),
      titularHelper:
        [resguardo.usuarioTitular?.neyemp, resguardo.usuarioTitular?.email]
          .filter(Boolean)
          .join(" · ") || undefined,
      fechaAsignacion: resguardo.fechaAsignacion
        ? formatDate(resguardo.fechaAsignacion)
        : EMPTY_VALUE,
    },
    sections: [
      {
        title: "Datos del equipo",
        icon: <FileText size={16} strokeWidth={1.9} />,
        items: [
          {
            label: "Tipo de bien",
            value: formatText(resguardo.tipoBien?.descTipoBien, EMPTY_VALUE),
          },
          {
            label: "Marca",
            value: formatText(getMarcaLabel(resguardo.marca), EMPTY_VALUE),
          },
          {
            label: "Modelo",
            value: formatText(resguardo.modelo?.descModelo, EMPTY_VALUE),
          },
          { label: "Numero de serie", value: formatValue(resguardo.numeroSerie) },
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
            label: "Procesador",
            value: formatText(resguardo.procesador?.descProcesador, EMPTY_VALUE),
          },
          {
            label: "Color / material",
            value: formatText(resguardo.colorMaterial?.descMaterial, EMPTY_VALUE),
          },
          { label: "IP", value: formatValue(resguardo.ip) },
          { label: "MAC", value: formatValue(resguardo.mac) },
        ],
      },
      {
        title: "Responsables",
        icon: <UserRound size={16} strokeWidth={1.9} />,
        items: [
          {
            label: "Resguarda",
            value: formatText(resguardo.usuarioResguarda?.nombre, EMPTY_VALUE),
            secondary: resguardo.usuarioResguarda?.neyemp?.trim() || undefined,
          },
          {
            label: "Asigna",
            value: FIXED_ASSIGN_USER_NAME,
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
          {
            label: "Observaciones",
            value: formatValue(resguardo.observaciones),
            wide: true,
          },
        ],
      },
    ],
    accessories,
  };
}
