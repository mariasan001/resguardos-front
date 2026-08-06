import type { jsPDF } from "jspdf";

import { setFont } from "./assets";
import {
  CONTENT_PAGE_BOTTOM,
  CONTINUATION_PAGE_TOP,
  FIRST_PAGE_LEFT,
  FIRST_PAGE_WIDTH,
  MAROON,
  PAGE_WIDTH,
  TEXT_COLOR,
} from "./constants";

export function drawTopRibbon(doc: jsPDF) {
  doc.setFillColor(...MAROON);
  doc.rect(0, 0, PAGE_WIDTH, 5.5, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 5.5, PAGE_WIDTH, 1.3, "F");
}

export function drawContinuationPageBase(doc: jsPDF) {
  doc.addPage();
  drawTopRibbon(doc);
}

export function ensureContentPageSpace(
  doc: jsPDF,
  nextY: number,
  requiredHeight: number,
) {
  if (nextY + requiredHeight <= CONTENT_PAGE_BOTTOM) {
    return nextY;
  }

  drawContinuationPageBase(doc);
  return CONTINUATION_PAGE_TOP;
}

export function drawContentFooter(doc: jsPDF, y: number, footerLegal: string) {
  const availableHeight = Math.max(CONTENT_PAGE_BOTTOM - y, 10);
  let fontSize = 5.7;
  let lineHeight = 2.85;
  let footerLines: string[] = [];
  let footerHeight = 0;

  while (fontSize >= 5) {
    setFont(doc, "normal", fontSize);
    footerLines = doc.splitTextToSize(footerLegal, FIRST_PAGE_WIDTH) as string[];
    footerHeight = footerLines.length * lineHeight;

    if (footerHeight <= availableHeight) {
      break;
    }

    fontSize = Number((fontSize - 0.15).toFixed(2));
    lineHeight = Math.max(2.55, lineHeight - 0.08);
  }

  setFont(doc, "normal", fontSize);
  doc.setTextColor(...TEXT_COLOR);
  const footerStartY = y + Math.max((availableHeight - footerHeight) / 2, 0);
  doc.text(footerLines, FIRST_PAGE_LEFT, footerStartY);
  return footerStartY + footerHeight;
}
