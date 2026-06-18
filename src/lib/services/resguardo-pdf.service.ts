import { jsPDF } from "jspdf";

import type { PreviewResguardoDraft, Resguardo } from "@/lib/types/api";
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
const BROWN: [number, number, number] = [164, 121, 57];
const LIGHT_BORDER: [number, number, number] = [199, 199, 199];
const LABEL_COLOR: [number, number, number] = [74, 74, 74];
const TEXT_COLOR: [number, number, number] = [27, 27, 27];

interface GenerateResguardoPdfParams {
  createdResguardoId: number;
  draft: PreviewResguardoDraft;
  resguardo: Resguardo;
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

function drawSectionBar(doc: jsPDF, y: number, title: string) {
  doc.setFillColor(...BROWN);
  doc.roundedRect(FIRST_PAGE_LEFT, y, FIRST_PAGE_WIDTH, 7.5, 1.2, 1.2, "F");
  setFont(doc, "bold", 9.4);
  doc.setTextColor(255, 255, 255);
  doc.text(title, FIRST_PAGE_LEFT + 2.5, y + 5.1);
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

function drawWrappedLabelValueRow(
  doc: jsPDF,
  labelX: number,
  labelWidth: number,
  valueX: number,
  valueWidth: number,
  y: number,
  label: string,
  value: string,
  lineHeight = 4.8,
  options?: {
    labelFontSize?: number;
    valueFontSize?: number;
    minValueFontSize?: number;
    maxValueLines?: number;
  },
) {
  const labelFontSize = options?.labelFontSize ?? 8.3;
  let valueFontSize = options?.valueFontSize ?? 8.1;
  const minValueFontSize = options?.minValueFontSize ?? valueFontSize;
  const maxValueLines = options?.maxValueLines ?? Number.POSITIVE_INFINITY;

  setFont(doc, "normal", labelFontSize);
  doc.setTextColor(...LABEL_COLOR);
  const labelLines = doc.splitTextToSize(label, labelWidth) as string[];
  let valueLines: string[] = [];

  while (valueFontSize >= minValueFontSize) {
    setFont(doc, "bold", valueFontSize);
    valueLines = doc.splitTextToSize(value, valueWidth) as string[];

    if (valueLines.length <= maxValueLines || valueFontSize === minValueFontSize) {
      break;
    }

    valueFontSize = Number((valueFontSize - 0.2).toFixed(2));
  }

  setFont(doc, "normal", labelFontSize);
  doc.text(labelLines, labelX, y);
  setFont(doc, "bold", valueFontSize);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(valueLines, valueX, y);

  return y + Math.max(labelLines.length, valueLines.length) * lineHeight + 1.2;
}

function drawSectionRows(
  doc: jsPDF,
  y: number,
  title: string,
  rows: Array<[string, string]>,
) {
  let currentY = ensureContentPageSpace(doc, y, 10);
  drawSectionBar(doc, currentY, title);
  currentY += 11.6;

  rows.forEach(([label, value]) => {
    currentY = ensureContentPageSpace(doc, currentY, 8);
    currentY = drawWrappedLabelValueRow(
      doc,
      FIRST_PAGE_LEFT + 2,
      66,
      108,
      78,
      currentY,
      label,
      value,
      4.6,
      {
        labelFontSize: 8,
        valueFontSize: 7.9,
        minValueFontSize: 7.1,
        maxValueLines: 2,
      },
    );
  });

  return currentY;
}

function drawCommentsBlock(doc: jsPDF, y: number, text: string) {
  let currentY = ensureContentPageSpace(doc, y, 14);

  setFont(doc, "bold", 9.6);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("Comentarios:", FIRST_PAGE_LEFT, currentY);

  const commentLines = doc.splitTextToSize(text, FIRST_PAGE_WIDTH - 6) as string[];
  const boxHeight = Math.max(26, commentLines.length * 4.7 + 6);
  currentY = ensureContentPageSpace(doc, currentY + 3, boxHeight + 4);

  if (currentY !== y + 3) {
    setFont(doc, "bold", 9.6);
    doc.setTextColor(...TEXT_COLOR);
    doc.text("Comentarios:", FIRST_PAGE_LEFT, currentY - 3);
  }

  doc.setDrawColor(...LIGHT_BORDER);
  doc.roundedRect(FIRST_PAGE_LEFT, currentY, FIRST_PAGE_WIDTH, boxHeight, 2.2, 2.2);
  setFont(doc, "normal", 8.2);
  doc.text(commentLines, FIRST_PAGE_LEFT + 2, currentY + 5.6);

  return currentY + boxHeight;
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
  if (signatureDataUrl) {
    const imageProps = doc.getImageProperties(signatureDataUrl);
    const maxImageWidth = width - 6;
    const maxImageHeight = 24;
    let renderWidth = maxImageWidth;
    let renderHeight = (imageProps.height / imageProps.width) * renderWidth;

    if (renderHeight > maxImageHeight) {
      renderHeight = maxImageHeight;
      renderWidth = (imageProps.width / imageProps.height) * renderHeight;
    }

    const renderX = x + (width - renderWidth) / 2;
    const renderY = y + Math.max((maxImageHeight - renderHeight) / 2, 0);
    doc.addImage(signatureDataUrl, "PNG", renderX, renderY, renderWidth, renderHeight, undefined, "FAST");
  }

  doc.setDrawColor(116, 116, 116);
  doc.setLineDashPattern([1.6, 1.6], 0);
  doc.line(x, y + 25.5, x + width, y + 25.5);
  doc.setLineDashPattern([], 0);

  setFont(doc, "bold", 9);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(name, x + width / 2, y + 30.6, { align: "center" });

  setFont(doc, "normal", 8.2);
  doc.text(subtitle, x + width / 2, y + 35.1, { align: "center" });
}

function getEntregaName(draft: PreviewResguardoDraft) {
  return draft.usuarioAsignaLabel.trim() || draft.usuarioResguardaLabel.trim() || EMPTY_VALUE;
}

const NORMATIVE_TEXT = [
  "Quien suscribe, servidor(a) publico(a) adscrito(a) a la Direccion General de Personal, en calidad de Resguardatario(a), me comprometo a dar un uso adecuado al bien mueble que me ha sido asignado, asumiendo la responsabilidad de su resguardo en el lugar destinado para el desempeno de mis funciones, asi como de su plena identificacion y utilizacion dentro de mis actividades laborales. Asimismo, me obligo a notificar oportunamente, por conducto de mi superior jerarquico inmediato, a la Direccion de Sistemas y Tecnologias de la Informacion, con copia a la Delegacion Administrativa, cualquier movimiento o anomalia que el mobiliario presente, tal como: deterioro, obsolescencia, transferencia, prestamo, extravio, robo o cualquier otro que represente no tener mas en posesion y bajo cuidado el bien mueble del que para todos los efectos aludidos me he responsabilizado a la firma de la presente.",
  "Siendo consciente de la responsabilidad que se delimita a la firma del presente resguardo, reconozco mi derecho a utilizar el mobiliario del que se me ha dotado para el exclusivo desempeno de mis funciones y para la correcta atencion de los trabajos que se me encomiendan, asimismo reconozco la obligacion de resarcir en todo o en parte el bien mueble que con motivo de mi conducta ya sea por accion u omision, causare perjuicio al patrimonio mobiliario estatal, se proceda al cobro del mismo por conducto de quien tenga las facultades legales para hacerlo, conforme a la normatividad vigente.",
  "Tiene soporte normativo y juridico a la firma de la presente Tarjeta de Resguardo lo contenido por los dispositivos 108, 109 y 134 de la Constitucion Politica de los Estados Unidos Mexicanos, 130 fraccion I, parrafo cuarto de la Constitucion Politica del Estado Libre y Soberano de Mexico; lo establecido por el articulo 47 fraccion VIII de la Ley Organica de la Administracion Publica del Estado de Mexico, los articulos 5, 13, 14, 17, 18 fraccion VI, 27, 48, 49, 52 y 67 de la Ley de Bienes del Estado de Mexico y de sus Municipios, asi como los dispositivos 5.6, 5.11, 5.12, 5.13 y 5.15 del Codigo Civil del Estado de Mexico, lo regulado por los articulos 7 fraccion VI, 50 fraccion V, IX y XIII de la Ley de Responsabilidades Administrativas del Estado de Mexico y Municipios, lo contenido en los articulos 4 fraccion I, 5 y 10 de la Ley de Contratacion Publica del Estado de Mexico y Municipios, lo dispuesto por el articulo 9, fraccion VIII del Reglamento para los Procesos de Entrega y Recepcion y de Rendicion de Cuentas de la Administracion Publica del Estado de Mexico, lo previsto en las POBALINES: 001, 003, 004 y 007 del Acuerdo por el que se establecen las Politicas Bases y Lineamientos, en materia de Adquisiciones, Enajenaciones, Arrendamientos y Servicios de las Dependencias, Organismos Auxiliares y Tribunales Administrativos del Poder Ejecutivo Estatal (POBALINES) vigentes, asi como lo regulado en las fojas 74 y 75 del Manual General de Organizacion de la Oficialia Mayor, lo contemplado por los articulos 10 fracciones II y XXIII y 11 del Reglamento Interior de la Oficialia Mayor, y con relacion a lo expuesto por la persona titular de la Oficialia Mayor, en el Acuerdo por el que se reforman diversos apartados del Manual General de Organizacion de la Oficialia Mayor, publicado en el Periodico Oficial Gaceta del Gobierno del Estado Libre y Soberano de Mexico, de fecha 03 de enero de 2025, en cumplimiento a lo estipulado en la foja 19 respecto de las funciones que debe desempenar la Subdireccion de Desarrollo Tecnologico como se detalla en su numeral 11.",
];

export async function generateResguardoPdf({
  createdResguardoId,
  draft,
  resguardo,
}: GenerateResguardoPdfParams) {
  const [logosDataUrl, fondoDataUrl, cintaDataUrl, firmaEntregaDataUrl, poppinsRegular, poppinsBold] = await Promise.all([
    getAssetDataUrl("/img/logos.png"),
    getAssetDataUrl("/img/fondo.jpg"),
    getAssetDataUrl("/img/cinta.png"),
    getAssetDataUrl("/img/firma.png"),
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
  const generatedDate = formatCompactDate(resguardo.fechaCreacion || new Date().toISOString());
  const titularName = getValue(draft.usuarioTitularLabel).toUpperCase();
  const resguardaName = getValue(draft.usuarioResguardaLabel || draft.usuarioTitularLabel).toUpperCase();
  const entregaName = getValue(getEntregaName(draft)).toUpperCase();
  const accesorios: Array<[string, string]> =
    resguardo.detalles?.map((detalle) => [
      getValue(detalle.accesorio?.descAccesorio),
      getValue(detalle.numeroSerie),
    ]) ?? [];

  drawTopRibbon(doc);
  doc.addImage(logosDataUrl, "PNG", FIRST_PAGE_LEFT, 11.5, 66, 12.2);

  setFont(doc, "bold", 7.6);
  doc.setTextColor(...MAROON);
  doc.text("Información General", FIRST_PAGE_LEFT, 37);

  setFont(doc, "bold", 10.8);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(titularName, FIRST_PAGE_LEFT, 41.9);

  setFont(doc, "normal", 7.9);
  doc.setTextColor(100, 100, 100);
  doc.text(getValue(resguardo.usuarioTitular?.puesto?.des_neccat), FIRST_PAGE_LEFT, 45.7);
  setFont(doc, "normal", 7.1);
  doc.text(getValue(resguardo.usuarioTitular?.email), FIRST_PAGE_LEFT, 49.4);

  setFont(doc, "bold", 8.2);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("Dirección General de Personal", FIRST_PAGE_RIGHT_BLOCK_X, 16.3);
  setFont(doc, "normal", 6.6);
  doc.text("Dirección de Sistemas y", FIRST_PAGE_RIGHT_BLOCK_X, 20.3);
  doc.text("Tecnologías De La Información.", FIRST_PAGE_RIGHT_BLOCK_X, 24);
  doc.text("Subdirección de Desarrollo Tecnológico", FIRST_PAGE_RIGHT_BLOCK_X, 27.7);
  doc.text(generatedDate, FIRST_PAGE_RIGHT_BLOCK_X, 34.9);

  setFont(doc, "bold", 8.1);
  doc.setTextColor(...MAROON);
  doc.text("Información", 132, 51.5);

  let topInfoLeftY = 56.8;
  topInfoLeftY = drawWrappedLabelValueRow(
    doc,
    FIRST_PAGE_LEFT,
    34,
    58,
    60,
    topInfoLeftY,
    "Clave del Servidor:",
    getValue(resguardo.usuarioTitular?.neyemp),
  );
  topInfoLeftY = drawWrappedLabelValueRow(
    doc,
    FIRST_PAGE_LEFT,
    34,
    58,
    60,
    topInfoLeftY,
    "Adscripción:",
    getValue(resguardo.usuarioTitular?.adscripcion?.necads),
  );

  let topInfoRightY = 56.8;
  topInfoRightY = drawWrappedLabelValueRow(
    doc,
    132,
    24,
    168,
    24,
    topInfoRightY,
    "IP:",
    getValue(resguardo.ip),
  );
  topInfoRightY = drawWrappedLabelValueRow(
    doc,
    132,
    24,
    168,
    24,
    topInfoRightY,
    "Marca:",
    getValue(resguardo.marca),
  );
  topInfoRightY = drawWrappedLabelValueRow(
    doc,
    132,
    32,
    168,
    24,
    topInfoRightY,
    "Folio de Resguardo:",
    folioId,
  );

  const areaBottomY = drawWrappedLabelValueRow(
    doc,
    FIRST_PAGE_LEFT,
    34,
    58,
    56,
    topInfoLeftY + 0.8,
    "Dirección y/o Área:",
    getValue(resguardo.usuarioTitular?.adscripcion?.desAds),
    4.55,
    {
      labelFontSize: 8.1,
      valueFontSize: 7.25,
      minValueFontSize: 6.7,
      maxValueLines: 3,
    },
  );

  let y = Math.max(areaBottomY, topInfoRightY) + 1.8;

  const featureRows: Array<[string, string]> = [
    ["Sistema Operativo:", getValue(resguardo.sistemaOperativo?.descSo || draft.sistemaOperativoLabel)],
    ["Tipo de Bien:", getValue(resguardo.tipoBien?.descTipoBien || draft.tipoBienLabel)],
    ["Modelo:", getValue(resguardo.modelo?.descModelo || draft.modeloLabel)],
    ["N. Serie:", getValue(resguardo.numeroSerie)],
    ["Mac:", getValue(resguardo.mac)],
    ["Color y Material:", getValue(resguardo.colorMaterial?.descMaterial || draft.colorMaterialLabel)],
    ["Procesador:", getValue(resguardo.procesador?.descProcesador || draft.procesadorLabel)],
  ];

  y += 2.4;
  y = drawSectionRows(doc, y, "Características", featureRows);

  y += 2.2;
  y = drawSectionRows(
    doc,
    y,
    "Accesorios",
    accesorios.length ? accesorios : [["Sin accesorios:", EMPTY_VALUE]],
  );

  y += 2;
  y = drawCommentsBlock(doc, y, getValue(resguardo.observaciones || draft.observaciones));

  y += 2.4;
  y = ensureContentPageSpace(doc, y, 47);

  drawSignatureBlock(
    doc,
    trimmedTitularSignatureDataUrl,
    35,
    y,
    56,
    resguardaName,
    "Nombre y Persona de quien resguarda",
  );

  drawSignatureBlock(
    doc,
    trimmedEntregaSignatureDataUrl,
    120,
    y,
    56,
    entregaName,
    "Nombre y Persona de quien entrega",
  );

  setFont(doc, "normal", 6.4);
  doc.setTextColor(...TEXT_COLOR);
  const footerLegal =
    "Los datos personales recabados serán utilizados exclusivamente para fines administrativos y de control interno por la Dirección de Sistemas y Tecnologías de la Información. Serán resguardados conforme a la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados, garantizando su confidencialidad y seguridad.";
  drawContentFooter(doc, y + 42, footerLegal);

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
