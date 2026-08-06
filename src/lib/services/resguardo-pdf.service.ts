import { jsPDF } from "jspdf";

import { FIXED_ASSIGN_USER_NAME } from "@/lib/constants/assigner";
import type { Accesorio, PreviewResguardoDraft, Resguardo } from "@/lib/types/api";
import {
  formatTitleCase,
  getEstadoLabel,
  getMarcaLabel,
} from "@/lib/utils/format";
import { completeResguardoAccesorios } from "@/lib/utils/resguardo-accesorios";
import { trimSignatureDataUrl } from "@/lib/utils/signature";

const EMPTY_VALUE = "\u2014";
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const FIRST_PAGE_LEFT = 16;
const FIRST_PAGE_RIGHT = 194;
const FIRST_PAGE_WIDTH = FIRST_PAGE_RIGHT - FIRST_PAGE_LEFT;
const FIRST_PAGE_RIGHT_BLOCK_X = 150;
const PAGE_FOOTER_Y = 278;
const CONTENT_PAGE_BOTTOM = 262;
const CONTINUATION_PAGE_TOP = 18;
const NORMATIVE_LEFT = 18;
const NORMATIVE_WIDTH = 174;
const MAROON: [number, number, number] = [133, 25, 53];
const LIGHT_BORDER: [number, number, number] = [199, 199, 199];
const LABEL_COLOR: [number, number, number] = [74, 74, 74];
const TEXT_COLOR: [number, number, number] = [27, 27, 27];

interface GenerateResguardoPdfParams {
  createdResguardoId: number;
  draft: PreviewResguardoDraft;
  resguardo: Resguardo;
  accesoriosCatalogo?: Accesorio[];
}

const assetCache = new Map<string, Promise<string>>();
const binaryAssetCache = new Map<string, Promise<string>>();

function getValue(value?: string | number | null) {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }

  const text = String(value).trim();
  return text || EMPTY_VALUE;
}

function formatCompactDate(value?: string) {
  if (!value) {
    return EMPTY_VALUE;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day} . ${month} . ${year}`;
}

function getAssetDataUrl(path: string) {
  const cached = assetCache.get(path);

  if (cached) {
    return cached;
  }

  const promise = fetch(path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`No fue posible cargar el recurso ${path}.`);
      }

      return response.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error(`No fue posible leer el recurso ${path}.`));
          reader.readAsDataURL(blob);
        }),
    );

  assetCache.set(path, promise);
  return promise;
}

function arrayBufferToBinaryString(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return binary;
}

function getBinaryAsset(path: string) {
  const cached = binaryAssetCache.get(path);

  if (cached) {
    return cached;
  }

  const promise = fetch(path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`No fue posible cargar el recurso ${path}.`);
      }

      return response.arrayBuffer();
    })
    .then(arrayBufferToBinaryString);

  binaryAssetCache.set(path, promise);
  return promise;
}

function setFont(doc: jsPDF, style: "normal" | "bold", size: number) {
  doc.setFont("Poppins", style);
  doc.setFontSize(size);
}

function registerPoppinsFonts(doc: jsPDF, regularFont: string, boldFont: string) {
  doc.addFileToVFS("Poppins-Regular.ttf", regularFont);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  doc.addFileToVFS("Poppins-Bold.ttf", boldFont);
  doc.addFont("Poppins-Bold.ttf", "Poppins", "bold");
}

function drawTopRibbon(doc: jsPDF) {
  doc.setFillColor(...MAROON);
  doc.rect(0, 0, PAGE_WIDTH, 5.5, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 5.5, PAGE_WIDTH, 1.3, "F");
}

function drawContinuationPageBase(doc: jsPDF) {
  doc.addPage();
  drawTopRibbon(doc);
}

function ensureContentPageSpace(
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

function drawCommentsBlock(doc: jsPDF, y: number, text: string) {
  return drawReceiptTextBlock(doc, y, "Comentarios", text);
}

function drawContentFooter(doc: jsPDF, y: number, footerLegal: string) {
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

function drawNormativePageBase(doc: jsPDF, fondoDataUrl: string, cintaDataUrl: string) {
  doc.addPage();
  doc.addImage(fondoDataUrl, "JPEG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  doc.addImage(cintaDataUrl, "PNG", 12, 10.1, 92, 13.8);
}

function ensureNormativeSpace(
  doc: jsPDF,
  nextY: number,
  requiredHeight: number,
  fondoDataUrl: string,
  cintaDataUrl: string,
) {
  if (nextY + requiredHeight <= PAGE_FOOTER_Y - 8) {
    return nextY;
  }

  drawNormativePageBase(doc, fondoDataUrl, cintaDataUrl);
  return 28;
}

function drawNormativeParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  fondoDataUrl: string,
  cintaDataUrl: string,
  fontSize = 8.5,
  lineHeight = 5.2,
) {
  setFont(doc, "normal", fontSize);
  doc.setTextColor(...TEXT_COLOR);
  const lines = doc.splitTextToSize(text, width) as string[];

  let currentY = y;

  lines.forEach((line, index) => {
    currentY = ensureNormativeSpace(doc, currentY, lineHeight, fondoDataUrl, cintaDataUrl);
    setFont(doc, "normal", fontSize);
    doc.setTextColor(...TEXT_COLOR);

    const isLastLine = index === lines.length - 1;
    const words = line.trim().split(/\s+/).filter(Boolean);

    if (isLastLine || words.length <= 1) {
      doc.text(line, x, currentY);
    } else {
      const lineWidth =
        doc.getTextWidth(words.join("")) +
        words.slice(0, -1).reduce((total, word) => total + doc.getTextWidth(`${word} `) - doc.getTextWidth(word), 0);

      const extraSpace = Math.max(width - lineWidth, 0);
      const extraPerGap = words.length > 1 ? extraSpace / (words.length - 1) : 0;

      let currentX = x;
      words.forEach((word, wordIndex) => {
        doc.text(word, currentX, currentY);
        currentX += doc.getTextWidth(word);

        if (wordIndex < words.length - 1) {
          currentX += doc.getTextWidth(" ") + extraPerGap;
        }
      });
    }

    currentY += lineHeight;
  });

  return currentY;
}

function drawSignatureBlock(
  doc: jsPDF,
  signatureDataUrl: string | undefined,
  x: number,
  y: number,
  width: number,
  name: string,
  subtitle: string,
) {
  const imageAreaHeight = 26;

  if (signatureDataUrl) {
    const imageProps = doc.getImageProperties(signatureDataUrl);
    const maxImageWidth = width - 8;
    let renderWidth = maxImageWidth;
    let renderHeight = (imageProps.height / imageProps.width) * renderWidth;

    if (renderHeight > imageAreaHeight) {
      renderHeight = imageAreaHeight;
      renderWidth = (imageProps.width / imageProps.height) * renderHeight;
    }

    const renderX = x + (width - renderWidth) / 2;
    const renderY = y + Math.max((imageAreaHeight - renderHeight) / 2, 0);
    doc.addImage(
      signatureDataUrl,
      "PNG",
      renderX,
      renderY,
      renderWidth,
      renderHeight,
      undefined,
      "FAST",
    );
  }

  const lineY = y + imageAreaHeight + 1.5;
  doc.setDrawColor(140, 140, 140);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([1.4, 1.4], 0);
  doc.line(x + 4, lineY, x + width - 4, lineY);
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.2);

  setFont(doc, "bold", 8.6);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(name, x + width / 2, lineY + 5.2, { align: "center" });

  setFont(doc, "normal", 7.4);
  doc.setTextColor(...LABEL_COLOR);
  doc.text(subtitle, x + width / 2, lineY + 10, { align: "center" });
}

interface AccesorioPdfItem {
  accesorio?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
}

/**
 * El listado guardado manda solo el accesorio y la serie, asi que la marca y el
 * modelo se completan con lo capturado en el formulario cuando el backend no
 * los regresa.
 */
function buildAccesorioItems(
  resguardo: Resguardo,
  draft: PreviewResguardoDraft,
): AccesorioPdfItem[] {
  const captured = draft.detalles ?? [];
  const stored = resguardo.detalles ?? [];

  if (stored.length) {
    return stored.map((detalle, index) => {
      const fallback =
        captured.find(
          (item) =>
            item.accesorioId &&
            item.accesorioId === String(detalle.accesorio?.id ?? ""),
        ) ?? captured[index];

      return {
        accesorio: detalle.accesorio?.descAccesorio || fallback?.accesorioLabel,
        marca: getMarcaLabel(detalle.accesorio?.marca) || fallback?.marcaLabel,
        modelo: detalle.accesorio?.modelo || fallback?.modeloLabel,
        numeroSerie: detalle.numeroSerie || fallback?.numeroSerie,
      };
    });
  }

  return captured.map((item) => ({
    accesorio: item.accesorioLabel,
    marca: item.marcaLabel,
    modelo: item.modeloLabel,
    numeroSerie: item.numeroSerie,
  }));
}

function measureWrappedLines(
  doc: jsPDF,
  text: string,
  width: number,
  fontStyle: "normal" | "bold",
  fontSize: number,
) {
  setFont(doc, fontStyle, fontSize);
  return doc.splitTextToSize(text, width) as string[];
}

function drawSectionLabel(doc: jsPDF, y: number, title: string) {
  let currentY = ensureContentPageSpace(doc, y, 7);
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

function drawCompactMetaRow(
  doc: jsPDF,
  y: number,
  cells: Array<{ label: string; value: string }>,
) {
  let currentY = ensureContentPageSpace(doc, y, 12);
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
  let currentY = ensureContentPageSpace(doc, y, 12);
  setFont(doc, "bold", 11);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(name, FIRST_PAGE_LEFT, currentY + 3.2);

  const detail = details.filter((item) => item && item !== EMPTY_VALUE).join("   ·   ");
  if (detail) {
    setFont(doc, "normal", 6.8);
    doc.setTextColor(...LABEL_COLOR);
    const lines = measureWrappedLines(doc, detail, FIRST_PAGE_WIDTH, "normal", 6.8);
    doc.text(lines[0] ?? "", FIRST_PAGE_LEFT, currentY + 7.6);
    return currentY + 11;
  }

  return currentY + 7.5;
}

/** Pares compactos Campo / Valor en dos columnas, sin celdas. */
function drawCompactFields(
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
    const rowLines = Math.max(leftValueLines.length, rightValueLines.length, 1);
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

function drawReceiptTextBlock(
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

function drawAccessoriesTable(
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
    doc.text(String(index + 1).padStart(2, "0"), FIRST_PAGE_LEFT, currentY + 2.4);

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

const NORMATIVE_TEXT = [
  "Quien suscribe, servidor(a) publico(a) adscrito(a) a la Direccion General de Personal, en calidad de Resguardatario(a), me comprometo a dar un uso adecuado al bien mueble que me ha sido asignado, asumiendo la responsabilidad de su resguardo en el lugar destinado para el desempeno de mis funciones, asi como de su plena identificacion y utilizacion dentro de mis actividades laborales. Asimismo, me obligo a notificar oportunamente, por conducto de mi superior jerarquico inmediato, a la Direccion de Sistemas y Tecnologias de la Informacion, con copia a la Delegacion Administrativa, cualquier movimiento o anomalia que el mobiliario presente, tal como: deterioro, obsolescencia, transferencia, prestamo, extravio, robo o cualquier otro que represente no tener mas en posesion y bajo cuidado el bien mueble del que para todos los efectos aludidos me he responsabilizado a la firma de la presente.",
  "Siendo consciente de la responsabilidad que se delimita a la firma del presente resguardo, reconozco mi derecho a utilizar el mobiliario del que se me ha dotado para el exclusivo desempeno de mis funciones y para la correcta atencion de los trabajos que se me encomiendan, asimismo reconozco la obligacion de resarcir en todo o en parte el bien mueble que con motivo de mi conducta ya sea por accion u omision, causare perjuicio al patrimonio mobiliario estatal, se proceda al cobro del mismo por conducto de quien tenga las facultades legales para hacerlo, conforme a la normatividad vigente.",
  "Tiene soporte normativo y juridico a la firma de la presente Tarjeta de Resguardo lo contenido por los dispositivos 108, 109 y 134 de la Constitucion Politica de los Estados Unidos Mexicanos, 130 fraccion I, parrafo cuarto de la Constitucion Politica del Estado Libre y Soberano de Mexico; lo establecido por el articulo 47 fraccion VIII de la Ley Organica de la Administracion Publica del Estado de Mexico, los articulos 5, 13, 14, 17, 18 fraccion VI, 27, 48, 49, 52 y 67 de la Ley de Bienes del Estado de Mexico y de sus Municipios, asi como los dispositivos 5.6, 5.11, 5.12, 5.13 y 5.15 del Codigo Civil del Estado de Mexico, lo regulado por los articulos 7 fraccion VI, 50 fraccion V, IX y XIII de la Ley de Responsabilidades Administrativas del Estado de Mexico y Municipios, lo contenido en los articulos 4 fraccion I, 5 y 10 de la Ley de Contratacion Publica del Estado de Mexico y Municipios, lo dispuesto por el articulo 9, fraccion VIII del Reglamento para los Procesos de Entrega y Recepcion y de Rendicion de Cuentas de la Administracion Publica del Estado de Mexico, lo previsto en las POBALINES: 001, 003, 004 y 007 del Acuerdo por el que se establecen las Politicas Bases y Lineamientos, en materia de Adquisiciones, Enajenaciones, Arrendamientos y Servicios de las Dependencias, Organismos Auxiliares y Tribunales Administrativos del Poder Ejecutivo Estatal (POBALINES) vigentes, asi como lo regulado en las fojas 74 y 75 del Manual General de Organizacion de la Oficialia Mayor, lo contemplado por los articulos 10 fracciones II y XXIII y 11 del Reglamento Interior de la Oficialia Mayor, y con relacion a lo expuesto por la persona titular de la Oficialia Mayor, en el Acuerdo por el que se reforman diversos apartados del Manual General de Organizacion de la Oficialia Mayor, publicado en el Periodico Oficial Gaceta del Gobierno del Estado Libre y Soberano de Mexico, de fecha 03 de enero de 2025, en cumplimiento a lo estipulado en la foja 19 respecto de las funciones que debe desempenar la Subdireccion de Desarrollo Tecnologico como se detalla en su numeral 11.",
];

export async function generateResguardoPdf({
  createdResguardoId,
  draft,
  resguardo: storedResguardo,
  accesoriosCatalogo,
}: GenerateResguardoPdfParams) {
  const resguardo = completeResguardoAccesorios(
    storedResguardo,
    accesoriosCatalogo,
  );

  const [logosDataUrl, fondoDataUrl, cintaDataUrl, firmaEntregaDataUrl, poppinsRegular, poppinsBold] = await Promise.all([
    getAssetDataUrl("/img/logos.png"),
    getAssetDataUrl("/img/fondo.jpg"),
    getAssetDataUrl("/img/cinta.png"),
    getAssetDataUrl("/img/firma2.png"),
    getBinaryAsset("/fonts/Poppins-Regular.ttf"),
    getBinaryAsset("/fonts/Poppins-Bold.ttf"),
  ]);
  const [trimmedTitularSignatureDataUrl, trimmedEntregaSignatureDataUrl] = await Promise.all([
    draft.signatureDataUrl ? trimSignatureDataUrl(draft.signatureDataUrl) : Promise.resolve(undefined),
    trimSignatureDataUrl(firmaEntregaDataUrl),
  ]);

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });
  registerPoppinsFonts(doc, poppinsRegular, poppinsBold);

  const folioId = String(resguardo.id ?? createdResguardoId).padStart(5, "0");
  const generatedDate = formatCompactDate(
    resguardo.fechaCreacion || new Date().toISOString(),
  );
  const assignmentDate = formatCompactDate(
    resguardo.fechaAsignacion || draft.fechaAsignacion,
  );
  const estadoLabel = getValue(
    draft.estadoLabel || getEstadoLabel(resguardo.idEstadoResguardo),
  );
  const titularName = formatTitleCase(
    draft.usuarioTitularLabel || resguardo.usuarioTitular?.nombre,
    EMPTY_VALUE,
  );
  const resguardaName = formatTitleCase(
    draft.usuarioResguardaLabel ||
      resguardo.usuarioResguarda?.nombre ||
      draft.usuarioTitularLabel,
    EMPTY_VALUE,
  );
  const entregaName = FIXED_ASSIGN_USER_NAME;
  const inventoryId = getValue(resguardo.idInventario || draft.idInventario);
  const referenciaInterna = getValue(
    resguardo.resguardo || draft.referenciaInterna || draft.resguardo,
  );
  const accesorios = buildAccesorioItems(resguardo, draft);

  drawTopRibbon(doc);
  doc.addImage(logosDataUrl, "PNG", FIRST_PAGE_LEFT, 9.8, 58, 10.6);

  setFont(doc, "bold", 7.6);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("Dirección General de Personal", FIRST_PAGE_RIGHT_BLOCK_X - 4, 13.8);
  setFont(doc, "normal", 6);
  doc.setTextColor(...LABEL_COLOR);
  doc.text("Dirección de Sistemas y Tecnologías de la Información", FIRST_PAGE_RIGHT_BLOCK_X - 4, 17.2);
  doc.text("Subdirección de Desarrollo Tecnológico", FIRST_PAGE_RIGHT_BLOCK_X - 4, 20.4);
  setFont(doc, "bold", 6.6);
  doc.setTextColor(...MAROON);
  doc.text(generatedDate, FIRST_PAGE_RIGHT_BLOCK_X - 4, 24.4);

  setFont(doc, "bold", 11.8);
  doc.setTextColor(...MAROON);
  doc.text("Tarjeta de Resguardo de Cómputo", FIRST_PAGE_LEFT, 34.2);

  let y = drawCompactMetaRow(doc, 37.4, [
    { label: "Folio", value: folioId },
    { label: "Inventario", value: inventoryId },
    { label: "Estatus", value: estadoLabel },
    { label: "Asignación", value: assignmentDate },
  ]);

  const titularPuesto = formatTitleCase(
    resguardo.usuarioTitular?.puesto?.des_neccat,
    EMPTY_VALUE,
  );
  const titularEmail = getValue(
    resguardo.usuarioTitular?.email || draft.usuarioTitularEmail,
  );

  y = drawCompactFields(
    doc,
    y,
    "Titular del resguardo",
    [
      ["Clave", getValue(resguardo.usuarioTitular?.neyemp || draft.usuarioTitularId)],
      ["Teléfono", getValue(resguardo.telefono || draft.telefono)],
      [
        "Adscripción",
        formatTitleCase(
          resguardo.usuarioTitular?.adscripcion?.desAds,
          EMPTY_VALUE,
        ),
      ],
      [
        "Clave adscripción",
        getValue(resguardo.usuarioTitular?.adscripcion?.necads),
      ],
      ["Referencia interna", referenciaInterna],
    ],
    {
      leadName: titularName,
      leadDetails: [titularPuesto, titularEmail === EMPTY_VALUE ? "" : titularEmail],
    },
  );

  y = drawCompactFields(doc, y, "Equipo asignado", [
    ["Tipo de bien", getValue(resguardo.tipoBien?.descTipoBien || draft.tipoBienLabel)],
    ["Marca", getValue(getMarcaLabel(resguardo.marca) || draft.marca)],
    ["Modelo", getValue(resguardo.modelo?.descModelo || draft.modeloLabel)],
    ["N. serie", getValue(resguardo.numeroSerie || draft.numeroSerie)],
    [
      "Sistema operativo",
      getValue(resguardo.sistemaOperativo?.descSo || draft.sistemaOperativoLabel),
    ],
    [
      "Procesador",
      getValue(resguardo.procesador?.descProcesador || draft.procesadorLabel),
    ],
    [
      "Color / material",
      getValue(resguardo.colorMaterial?.descMaterial || draft.colorMaterialLabel),
    ],
    ["IP", getValue(resguardo.ip || draft.ip)],
    ["MAC", getValue(resguardo.mac || draft.mac)],
  ]);

  y = drawAccessoriesTable(doc, y, accesorios);

  y = drawCommentsBlock(
    doc,
    y,
    getValue(resguardo.observaciones || draft.observaciones),
  );

  y += 4;
  y = ensureContentPageSpace(doc, y, 48);

  const signatureWidth = 68;
  const signatureGap = 36;
  const signaturesTotalWidth = signatureWidth * 2 + signatureGap;
  const leftSignatureX =
    FIRST_PAGE_LEFT + (FIRST_PAGE_WIDTH - signaturesTotalWidth) / 2;
  const rightSignatureX = leftSignatureX + signatureWidth + signatureGap;

  drawSignatureBlock(
    doc,
    trimmedTitularSignatureDataUrl,
    leftSignatureX,
    y,
    signatureWidth,
    resguardaName,
    "Nombre y firma de quien resguarda",
  );

  drawSignatureBlock(
    doc,
    trimmedEntregaSignatureDataUrl,
    rightSignatureX,
    y,
    signatureWidth,
    entregaName,
    "Nombre y firma de quien entrega",
  );

  setFont(doc, "normal", 6.2);
  doc.setTextColor(...TEXT_COLOR);
  const footerLegal =
    "Los datos personales recabados serán utilizados exclusivamente para fines administrativos y de control interno por la Dirección de Sistemas y Tecnologías de la Información. Serán resguardados conforme a la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados, garantizando su confidencialidad y seguridad.";
  drawContentFooter(doc, y + 44, footerLegal);

  drawNormativePageBase(doc, fondoDataUrl, cintaDataUrl);

  setFont(doc, "normal", 6.2);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("Dirección General de Personal", 152, 10.4);
  doc.text("Dirección de Sistemas y", 152, 14.1);
  doc.text("Tecnologías De La Información.", 152, 17.8);
  doc.text("Subdirección de Desarrollo Tecnológico", 152, 21.5);

  setFont(doc, "normal", 8.5);
  doc.text(
    "\"2025. Bicentenario de la vida municipal en el Estado de Mexico\"",
    PAGE_WIDTH / 2,
    40,
    { align: "center" },
  );

  setFont(doc, "bold", 11.2);
  doc.text("Normativa de Bienes Muebles", PAGE_WIDTH / 2, 50, { align: "center" });

  let normativeY = 62;
  setFont(doc, "bold", 8.6);
  doc.text(
    "Quien suscribe, servidor(a) publico(a) adscrito(a) a la Direccion General de Personal,",
    NORMATIVE_LEFT,
    normativeY,
  );

  normativeY += 8.5;
  NORMATIVE_TEXT.forEach((paragraph, index) => {
    const estimatedLines = (doc.splitTextToSize(paragraph, NORMATIVE_WIDTH) as string[]).length;
    const estimatedHeight = estimatedLines * 5.2;
    normativeY = ensureNormativeSpace(doc, normativeY, estimatedHeight, fondoDataUrl, cintaDataUrl);

    normativeY = drawNormativeParagraph(
      doc,
      paragraph,
      NORMATIVE_LEFT,
      normativeY,
      NORMATIVE_WIDTH,
      fondoDataUrl,
      cintaDataUrl,
      8.5,
      5.2,
    );

    if (index < NORMATIVE_TEXT.length - 1) {
      normativeY += 8.5;
    }
  });

  doc.setDrawColor(0, 0, 0);
  doc.line(12, PAGE_FOOTER_Y, 198, PAGE_FOOTER_Y);
  setFont(doc, "normal", 6.8);
  doc.text(
    "Portal Madero num. 216, primer piso IB, col Centro, C.P. 50000, Toluca, Estado de Mexico.",
    PAGE_WIDTH / 2,
    284.5,
    { align: "center" },
  );
  doc.text("Tel: (01 722) 213 88 77 ext. 104, 105 y 114.", PAGE_WIDTH / 2, 289, {
    align: "center",
  });

  const blob = doc.output("blob");
  const filename = `RESG${getValue(resguardo.usuarioTitular?.neyemp).replace(/\s+/g, "")}-${folioId}.pdf`;
  const file = new File([blob], filename, { type: "application/pdf" });

  return {
    blob,
    file,
    filename,
  };
}
