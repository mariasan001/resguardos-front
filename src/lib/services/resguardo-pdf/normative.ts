import type { jsPDF } from "jspdf";

import { setFont } from "./assets";
import {
  LABEL_COLOR,
  NORMATIVE_LEFT,
  NORMATIVE_WIDTH,
  PAGE_FOOTER_Y,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  TEXT_COLOR,
} from "./constants";

export const NORMATIVE_TEXT = [
  "Quien suscribe, servidor(a) publico(a) adscrito(a) a la Direccion General de Personal, en calidad de Resguardatario(a), me comprometo a dar un uso adecuado al bien mueble que me ha sido asignado, asumiendo la responsabilidad de su resguardo en el lugar destinado para el desempeno de mis funciones, asi como de su plena identificacion y utilizacion dentro de mis actividades laborales. Asimismo, me obligo a notificar oportunamente, por conducto de mi superior jerarquico inmediato, a la Direccion de Sistemas y Tecnologias de la Informacion, con copia a la Delegacion Administrativa, cualquier movimiento o anomalia que el mobiliario presente, tal como: deterioro, obsolescencia, transferencia, prestamo, extravio, robo o cualquier otro que represente no tener mas en posesion y bajo cuidado el bien mueble del que para todos los efectos aludidos me he responsabilizado a la firma de la presente.",
  "Siendo consciente de la responsabilidad que se delimita a la firma del presente resguardo, reconozco mi derecho a utilizar el mobiliario del que se me ha dotado para el exclusivo desempeno de mis funciones y para la correcta atencion de los trabajos que se me encomiendan, asimismo reconozco la obligacion de resarcir en todo o en parte el bien mueble que con motivo de mi conducta ya sea por accion u omision, causare perjuicio al patrimonio mobiliario estatal, se proceda al cobro del mismo por conducto de quien tenga las facultades legales para hacerlo, conforme a la normatividad vigente.",
  "Tiene soporte normativo y juridico a la firma de la presente Tarjeta de Resguardo lo contenido por los dispositivos 108, 109 y 134 de la Constitucion Politica de los Estados Unidos Mexicanos, 130 fraccion I, parrafo cuarto de la Constitucion Politica del Estado Libre y Soberano de Mexico; lo establecido por el articulo 47 fraccion VIII de la Ley Organica de la Administracion Publica del Estado de Mexico, los articulos 5, 13, 14, 17, 18 fraccion VI, 27, 48, 49, 52 y 67 de la Ley de Bienes del Estado de Mexico y de sus Municipios, asi como los dispositivos 5.6, 5.11, 5.12, 5.13 y 5.15 del Codigo Civil del Estado de Mexico, lo regulado por los articulos 7 fraccion VI, 50 fraccion V, IX y XIII de la Ley de Responsabilidades Administrativas del Estado de Mexico y Municipios, lo contenido en los articulos 4 fraccion I, 5 y 10 de la Ley de Contratacion Publica del Estado de Mexico y Municipios, lo dispuesto por el articulo 9, fraccion VIII del Reglamento para los Procesos de Entrega y Recepcion y de Rendicion de Cuentas de la Administracion Publica del Estado de Mexico, lo previsto en las POBALINES: 001, 003, 004 y 007 del Acuerdo por el que se establecen las Politicas Bases y Lineamientos, en materia de Adquisiciones, Enajenaciones, Arrendamientos y Servicios de las Dependencias, Organismos Auxiliares y Tribunales Administrativos del Poder Ejecutivo Estatal (POBALINES) vigentes, asi como lo regulado en las fojas 74 y 75 del Manual General de Organizacion de la Oficialia Mayor, lo contemplado por los articulos 10 fracciones II y XXIII y 11 del Reglamento Interior de la Oficialia Mayor, y con relacion a lo expuesto por la persona titular de la Oficialia Mayor, en el Acuerdo por el que se reforman diversos apartados del Manual General de Organizacion de la Oficialia Mayor, publicado en el Periodico Oficial Gaceta del Gobierno del Estado Libre y Soberano de Mexico, de fecha 03 de enero de 2025, en cumplimiento a lo estipulado en la foja 19 respecto de las funciones que debe desempenar la Subdireccion de Desarrollo Tecnologico como se detalla en su numeral 11.",
];

export function drawNormativePageBase(
  doc: jsPDF,
  fondoDataUrl: string,
  cintaDataUrl: string,
) {
  doc.addPage();
  doc.addImage(fondoDataUrl, "JPEG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  doc.addImage(cintaDataUrl, "PNG", 12, 10.1, 92, 13.8);
}

export function ensureNormativeSpace(
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

export function drawNormativeParagraph(
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
    currentY = ensureNormativeSpace(
      doc,
      currentY,
      lineHeight,
      fondoDataUrl,
      cintaDataUrl,
    );
    setFont(doc, "normal", fontSize);
    doc.setTextColor(...TEXT_COLOR);

    const isLastLine = index === lines.length - 1;
    const words = line.trim().split(/\s+/).filter(Boolean);

    if (isLastLine || words.length <= 1) {
      doc.text(line, x, currentY);
    } else {
      const lineWidth =
        doc.getTextWidth(words.join("")) +
        words
          .slice(0, -1)
          .reduce(
            (total, word) =>
              total + doc.getTextWidth(`${word} `) - doc.getTextWidth(word),
            0,
          );

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

export function drawSignatureBlock(
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

export function drawNormativeHeader(doc: jsPDF) {
  setFont(doc, "normal", 6.2);
  doc.setTextColor(...TEXT_COLOR);
  doc.text("Dirección General de Personal", 152, 10.4);
  doc.text("Dirección de Sistemas y", 152, 14.1);
  doc.text("Tecnologías De La Información.", 152, 17.8);
  doc.text("Subdirección de Desarrollo Tecnológico", 152, 21.5);

  setFont(doc, "normal", 8.5);
  doc.text(
    '"2026. Bicentenario de la vida municipal en el Estado de Mexico"',
    PAGE_WIDTH / 2,
    40,
    { align: "center" },
  );

  setFont(doc, "bold", 11.2);
  doc.text("Normativa de Bienes Muebles", PAGE_WIDTH / 2, 50, {
    align: "center",
  });
}

export function drawNormativeFooter(doc: jsPDF) {
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
}

export function drawNormativeBody(
  doc: jsPDF,
  fondoDataUrl: string,
  cintaDataUrl: string,
) {
  let normativeY = 62;
  setFont(doc, "bold", 8.6);
  doc.text(
    "Quien suscribe, servidor(a) publico(a) adscrito(a) a la Direccion General de Personal,",
    NORMATIVE_LEFT,
    normativeY,
  );

  normativeY += 8.5;
  NORMATIVE_TEXT.forEach((paragraph, index) => {
    const estimatedLines = (
      doc.splitTextToSize(paragraph, NORMATIVE_WIDTH) as string[]
    ).length;
    const estimatedHeight = estimatedLines * 5.2;
    normativeY = ensureNormativeSpace(
      doc,
      normativeY,
      estimatedHeight,
      fondoDataUrl,
      cintaDataUrl,
    );

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
}
