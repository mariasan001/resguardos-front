import type { jsPDF } from "jspdf";

import type { AccesorioPdfItem } from "./accessories";
import { getValue, setFont } from "./assets";
import {
  CONTINUATION_PAGE_TOP,
  EMPTY_VALUE,
  FIRST_PAGE_LEFT,
  FIRST_PAGE_RIGHT,
  FIRST_PAGE_WIDTH,
  LABEL_COLOR,
  LIGHT_BORDER,
  MAROON,
  TEXT_COLOR,
} from "./constants";
import { ensureContentPageSpace } from "./layout";

export function measureWrappedLines(
  doc: jsPDF,
  text: string,
  width: number,
  fontStyle: "normal" | "bold",
  fontSize: number,
) {
  setFont(doc, fontStyle, fontSize);
  return doc.splitTextToSize(text, width) as string[];
}

export function drawSectionLabel(doc: jsPDF, y: number, title: string) {
  const currentY = ensureContentPageSpace(doc, y, 7);
  doc.setFillColor(...MAROON);
  doc.rect(FIRST_PAGE_LEFT, currentY + 0.4, 1.6, 4.2, "F");
  setFont(doc, "bold", 7.8);
  doc.setTextColor(...MAROON);
  doc.text(title.toUpperCase(), FIRST_PAGE_LEFT + 4, currentY + 3.6);
  doc.setDrawColor(...LIGHT_BORDER);
  doc.setLineWidth(0.2);
  doc.line(FIRST_PAGE_LEFT + 42, currentY + 4.8, FIRST_PAGE_RIGHT, currentY + 4.8);
  return currentY + 7.4;
}

export function drawCompactMetaRow(
  doc: jsPDF,
  y: number,
  cells: Array<{ label: string; value: string }>,
) {
  const currentY = ensureContentPageSpace(doc, y, 12);
  const height = 11;
  const cellWidth = FIRST_PAGE_WIDTH / cells.length;

  doc.setFillColor(247, 245, 246);
  doc.rect(FIRST_PAGE_LEFT, currentY, FIRST_PAGE_WIDTH, height, "F");

  cells.forEach((cell, index) => {
    const x = FIRST_PAGE_LEFT + index * cellWidth + 2.4;
    setFont(doc, "normal", 5.8);
    doc.setTextColor(...LABEL_COLOR);
    doc.text(cell.label.toUpperCase(), x, currentY + 3.4);

    setFont(doc, "bold", 8.2);
    doc.setTextColor(...TEXT_COLOR);
    const lines = measureWrappedLines(
      doc,
      cell.value,
      cellWidth - 5,
      "bold",
      8.2,
    );
    doc.text(lines[0] ?? EMPTY_VALUE, x, currentY + 8.2);
  });

  return currentY + height + 3.2;
}

function drawPersonLead(
  doc: jsPDF,
  y: number,
  name: string,
  details: string[],
) {
  const currentY = ensureContentPageSpace(doc, y, 12);
  setFont(doc, "bold", 11);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(name, FIRST_PAGE_LEFT, currentY + 3.2);

  const detail = details
    .filter((item) => item && item !== EMPTY_VALUE)
    .join("   ·   ");
  if (detail) {
    setFont(doc, "normal", 6.8);
    doc.setTextColor(...LABEL_COLOR);
    const lines = measureWrappedLines(
      doc,
      detail,
      FIRST_PAGE_WIDTH,
      "normal",
      6.8,
    );
    doc.text(lines[0] ?? "", FIRST_PAGE_LEFT, currentY + 7.6);
    return currentY + 11;
  }

  return currentY + 7.5;
}

export function drawCompactFields(
  doc: jsPDF,
  y: number,
  title: string,
  fields: Array<[string, string]>,
  options?: { leadName?: string; leadDetails?: string[] },
) {
  let currentY = drawSectionLabel(doc, y, title);

  if (options?.leadName) {
    currentY = drawPersonLead(
      doc,
      currentY,
      options.leadName,
      options.leadDetails ?? [],
    );
  }

  const colGap = 10;
  const colWidth = (FIRST_PAGE_WIDTH - colGap) / 2;
  const lineHeight = 3.3;

  for (let index = 0; index < fields.length; index += 2) {
    const left = fields[index];
    const right = fields[index + 1];

    const leftValueLines = left
      ? measureWrappedLines(doc, left[1], colWidth, "bold", 7.6)
      : [];
    const rightValueLines = right
      ? measureWrappedLines(doc, right[1], colWidth, "bold", 7.6)
      : [];
    const rowLines = Math.max(
      leftValueLines.length,
      rightValueLines.length,
      1,
    );
    const rowHeight = 3.2 + rowLines * lineHeight;

    currentY = ensureContentPageSpace(doc, currentY, rowHeight + 1);

    if (currentY === CONTINUATION_PAGE_TOP) {
      currentY = drawSectionLabel(doc, currentY, `${title} (cont.)`);
    }

    if (left) {
      setFont(doc, "normal", 5.8);
      doc.setTextColor(...LABEL_COLOR);
      doc.text(left[0].toUpperCase(), FIRST_PAGE_LEFT, currentY + 2.2);
      setFont(doc, "bold", 7.6);
      doc.setTextColor(...TEXT_COLOR);
      doc.text(leftValueLines, FIRST_PAGE_LEFT, currentY + 5.8);
    }

    if (right) {
      const rightX = FIRST_PAGE_LEFT + colWidth + colGap;
      setFont(doc, "normal", 5.8);
      doc.setTextColor(...LABEL_COLOR);
      doc.text(right[0].toUpperCase(), rightX, currentY + 2.2);
      setFont(doc, "bold", 7.6);
      doc.setTextColor(...TEXT_COLOR);
      doc.text(rightValueLines, rightX, currentY + 5.8);
    }

    currentY += rowHeight + 0.8;
  }

  return currentY + 1.8;
}

export function drawReceiptTextBlock(
  doc: jsPDF,
  y: number,
  title: string,
  text: string,
) {
  let currentY = drawSectionLabel(doc, y, title);
  const lines = measureWrappedLines(doc, text, FIRST_PAGE_WIDTH, "normal", 7.2);
  const blockHeight = Math.max(8, lines.length * 3.4 + 1);
  currentY = ensureContentPageSpace(doc, currentY, blockHeight + 2);

  if (currentY === CONTINUATION_PAGE_TOP) {
    currentY = drawSectionLabel(doc, currentY, title);
  }

  setFont(doc, "normal", 7.2);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(lines, FIRST_PAGE_LEFT, currentY + 2.2);
  return currentY + blockHeight + 1.2;
}

export function drawCommentsBlock(doc: jsPDF, y: number, text: string) {
  return drawReceiptTextBlock(doc, y, "Comentarios", text);
}

export function drawAccessoriesTable(
  doc: jsPDF,
  y: number,
  items: AccesorioPdfItem[],
) {
  let currentY = drawSectionLabel(doc, y, "Accesorios");

  if (!items.length) {
    setFont(doc, "normal", 7.2);
    doc.setTextColor(...LABEL_COLOR);
    doc.text("Sin accesorios registrados", FIRST_PAGE_LEFT, currentY + 2);
    return currentY + 6.5;
  }

  items.forEach((item, index) => {
    currentY = ensureContentPageSpace(doc, currentY, 8);

    if (currentY === CONTINUATION_PAGE_TOP) {
      currentY = drawSectionLabel(doc, currentY, "Accesorios (cont.)");
    }

    setFont(doc, "bold", 7.4);
    doc.setTextColor(...MAROON);
    doc.text(
      String(index + 1).padStart(2, "0"),
      FIRST_PAGE_LEFT,
      currentY + 2.4,
    );

    setFont(doc, "bold", 7.6);
    doc.setTextColor(...TEXT_COLOR);
    doc.text(getValue(item.accesorio), FIRST_PAGE_LEFT + 8, currentY + 2.4);

    const meta = [
      getValue(item.marca),
      getValue(item.modelo),
      getValue(item.numeroSerie),
    ]
      .filter((value) => value !== EMPTY_VALUE)
      .join("   ·   ");

    setFont(doc, "normal", 6.6);
    doc.setTextColor(...LABEL_COLOR);
    doc.text(
      meta || "Sin marca, modelo o serie",
      FIRST_PAGE_LEFT + 8,
      currentY + 5.8,
    );

    currentY += 8.2;
  });

  return currentY + 1.5;
}
