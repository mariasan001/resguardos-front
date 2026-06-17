import { jsPDF } from "jspdf";

import type { PreviewResguardoDraft, Resguardo } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";

const EMPTY_VALUE = "\u2014";

interface GenerateResguardoPdfParams {
  createdResguardoId: number;
  draft: PreviewResguardoDraft;
  resguardo: Resguardo;
}

function getValue(value?: string | number | null) {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }

  const text = String(value).trim();
  return text || EMPTY_VALUE;
}

function addField(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(83, 96, 115);
  doc.text(label, x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  const lines = doc.splitTextToSize(value, width);
  doc.text(lines, x, y + 5);

  return y + 5 + lines.length * 5;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setDrawColor(224, 231, 239);
  doc.line(16, y, 194, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 36, 61);
  doc.text(title, 16, y + 6);
  return y + 12;
}

export async function generateResguardoPdf({
  createdResguardoId,
  draft,
  resguardo,
}: GenerateResguardoPdfParams) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const generatedAt = formatDate(new Date().toISOString());
  const folio = getValue(resguardo.id ?? createdResguardoId);
  const accesorios = resguardo.detalles?.length
    ? resguardo.detalles.map((detalle, index) => [
        `Accesorio ${index + 1}`,
        getValue(detalle.accesorio?.descAccesorio),
        getValue(detalle.numeroSerie),
      ])
    : [["Accesorios", EMPTY_VALUE, EMPTY_VALUE]];

  doc.setFillColor(243, 246, 249);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text("Formato de resguardo de computo", 16, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(83, 96, 115);
  doc.text(`Folio / ID: ${folio}`, 16, 23);
  doc.text(`Generado: ${generatedAt}`, 140, 23, { align: "right" });

  let y = 36;
  y = drawSectionTitle(doc, "Identificacion del resguardo", y);

  const leftX = 16;
  const rightX = 106;
  const columnWidth = 76;

  let leftY = y;
  let rightY = y;

  leftY = addField(doc, leftX, leftY, columnWidth, "Inventario", getValue(resguardo.idInventario));
  leftY = addField(doc, leftX, leftY + 3, columnWidth, "Marca", getValue(resguardo.marca));
  leftY = addField(doc, leftX, leftY + 3, columnWidth, "Numero de serie", getValue(resguardo.numeroSerie));
  leftY = addField(doc, leftX, leftY + 3, columnWidth, "Folio de resguardo", getValue(resguardo.resguardo));

  rightY = addField(doc, rightX, rightY, columnWidth, "Fecha de asignacion", resguardo.fechaAsignacion ? formatDate(resguardo.fechaAsignacion) : EMPTY_VALUE);
  rightY = addField(doc, rightX, rightY + 3, columnWidth, "Estado", getValue(draft.estadoLabel));
  rightY = addField(doc, rightX, rightY + 3, columnWidth, "Telefono", getValue(resguardo.telefono));
  rightY = addField(doc, rightX, rightY + 3, columnWidth, "IP / MAC", `${getValue(resguardo.ip)} / ${getValue(resguardo.mac)}`);

  y = Math.max(leftY, rightY) + 8;
  y = drawSectionTitle(doc, "Especificaciones y responsable", y);

  leftY = y;
  rightY = y;

  leftY = addField(doc, leftX, leftY, columnWidth, "Tipo de bien", getValue(resguardo.tipoBien?.descTipoBien || draft.tipoBienLabel));
  leftY = addField(doc, leftX, leftY + 3, columnWidth, "Modelo", getValue(resguardo.modelo?.descModelo || draft.modeloLabel));
  leftY = addField(doc, leftX, leftY + 3, columnWidth, "Sistema operativo", getValue(resguardo.sistemaOperativo?.descSo || draft.sistemaOperativoLabel));
  leftY = addField(doc, leftX, leftY + 3, columnWidth, "Procesador", getValue(resguardo.procesador?.descProcesador || draft.procesadorLabel));

  rightY = addField(doc, rightX, rightY, columnWidth, "Titular", getValue(draft.usuarioTitularLabel));
  rightY = addField(doc, rightX, rightY + 3, columnWidth, "Resguarda", getValue(draft.usuarioResguardaLabel));
  rightY = addField(doc, rightX, rightY + 3, columnWidth, "Asigna", getValue(draft.usuarioAsignaLabel));
  rightY = addField(doc, rightX, rightY + 3, columnWidth, "Area / referencia", getValue(draft.resguardo));

  y = Math.max(leftY, rightY) + 8;
  y = drawSectionTitle(doc, "Observaciones y accesorios", y);

  y = addField(doc, 16, y, 178, "Observaciones", getValue(resguardo.observaciones || draft.observaciones)) + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(83, 96, 115);
  doc.text("Accesorio", 16, y);
  doc.text("Descripcion", 66, y);
  doc.text("Serie", 146, y);
  y += 3;
  doc.setDrawColor(224, 231, 239);
  doc.line(16, y, 194, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  accesorios.forEach(([label, description, serie]) => {
    doc.text(label, 16, y);
    doc.text(description, 66, y);
    doc.text(serie, 146, y);
    y += 6;
  });

  y += 4;
  y = drawSectionTitle(doc, "Firma del titular", y);

  if (draft.signatureDataUrl) {
    doc.addImage(draft.signatureDataUrl, "PNG", 16, y, 72, 30);
  } else {
    doc.setDrawColor(224, 231, 239);
    doc.rect(16, y, 72, 30);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Sin firma disponible", 52, y + 17, { align: "center" });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(`Titular: ${getValue(draft.usuarioTitularLabel)}`, 96, y + 10);
  doc.text(`Inventario: ${getValue(resguardo.idInventario || draft.idInventario)}`, 96, y + 18);
  doc.text(`Resguardo: ${folio}`, 96, y + 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Documento generado desde el flujo de resguardos para revision y envio administrativo.",
    16,
    287,
  );

  const blob = doc.output("blob");
  const filename = `resguardo-${folio}.pdf`;
  const file = new File([blob], filename, { type: "application/pdf" });

  return {
    blob,
    file,
    filename,
  };
}
