import { jsPDF } from "jspdf";

import { ApiError } from "@/lib/api/errors";
import { FIXED_ASSIGN_USER_NAME } from "@/lib/constants/assigner";
import type { Accesorio, PreviewResguardoDraft, Resguardo } from "@/lib/types/api";
import { getResguardoQr } from "@/lib/services/resguardos.service";
import { blobToDataUrl } from "@/lib/utils/file";
import {
  formatTitleCase,
  getEstadoLabel,
  getMarcaLabel,
} from "@/lib/utils/format";
import { completeResguardoAccesorios } from "@/lib/utils/resguardo-accesorios";
import { trimSignatureDataUrl } from "@/lib/utils/signature";

import { buildAccesorioItems } from "./accessories";
import {
  formatCompactDate,
  getAssetDataUrl,
  getBinaryAsset,
  getValue,
  registerPoppinsFonts,
  setFont,
} from "./assets";
import {
  EMPTY_VALUE,
  FIRST_PAGE_LEFT,
  FIRST_PAGE_RIGHT_BLOCK_X,
  FIRST_PAGE_WIDTH,
  LABEL_COLOR,
  MAROON,
  TEXT_COLOR,
} from "./constants";
import {
  drawAccessoriesTable,
  drawCommentsBlock,
  drawCompactFields,
  drawCompactMetaRow,
} from "./content-blocks";
import {
  drawContentFooter,
  drawTopRibbon,
  ensureContentPageSpace,
} from "./layout";
import {
  drawNormativeBody,
  drawNormativeFooter,
  drawNormativeHeader,
  drawNormativePageBase,
  drawSignatureBlock,
} from "./normative";

export interface GenerateResguardoPdfParams {
  createdResguardoId: number;
  draft: PreviewResguardoDraft;
  resguardo: Resguardo;
  accesoriosCatalogo?: Accesorio[];
  /** Si se omite, se intenta obtener el QR autenticado del backend. */
  qrDataUrl?: string;
}

async function resolveQrDataUrl(
  resguardoId: number,
  provided?: string,
): Promise<string | undefined> {
  if (provided) {
    return provided;
  }

  try {
    const qrBlob = await getResguardoQr(resguardoId);
    return blobToDataUrl(qrBlob);
  } catch (error) {
    // El PDF sigue siendo útil sin QR (p. ej. 422 por payload demasiado grande).
    if (error instanceof ApiError && [404, 422].includes(error.status)) {
      return undefined;
    }
    throw error;
  }
}

export async function generateResguardoPdf({
  createdResguardoId,
  draft,
  resguardo: storedResguardo,
  accesoriosCatalogo,
  qrDataUrl: qrDataUrlParam,
}: GenerateResguardoPdfParams) {
  const resguardo = completeResguardoAccesorios(
    storedResguardo,
    accesoriosCatalogo,
  );

  const [
    logosDataUrl,
    fondoDataUrl,
    cintaDataUrl,
    firmaEntregaDataUrl,
    poppinsRegular,
    poppinsBold,
    qrDataUrl,
  ] = await Promise.all([
    getAssetDataUrl("/img/logos.png"),
    getAssetDataUrl("/img/fondo.jpg"),
    getAssetDataUrl("/img/cinta.png"),
    getAssetDataUrl("/img/firma2.png"),
    getBinaryAsset("/fonts/Poppins-Regular.ttf"),
    getBinaryAsset("/fonts/Poppins-Bold.ttf"),
    resolveQrDataUrl(createdResguardoId, qrDataUrlParam),
  ]);
  const [trimmedTitularSignatureDataUrl, trimmedEntregaSignatureDataUrl] =
    await Promise.all([
      draft.signatureDataUrl
        ? trimSignatureDataUrl(draft.signatureDataUrl)
        : Promise.resolve(undefined),
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
  doc.text(
    "Dirección de Sistemas y Tecnologías de la Información",
    FIRST_PAGE_RIGHT_BLOCK_X - 4,
    17.2,
  );
  doc.text(
    "Subdirección de Desarrollo Tecnológico",
    FIRST_PAGE_RIGHT_BLOCK_X - 4,
    20.4,
  );
  setFont(doc, "bold", 6.6);
  doc.setTextColor(...MAROON);
  doc.text(generatedDate, FIRST_PAGE_RIGHT_BLOCK_X - 4, 24.4);

  setFont(doc, "bold", 11.8);
  doc.setTextColor(...MAROON);
  doc.text("Tarjeta de Resguardo de Cómputo", FIRST_PAGE_LEFT, 34.2);

  let y = drawCompactMetaRow(doc, 37.4, [
    { label: "Inventario interno", value: folioId },
    { label: "Inventario SICOPA", value: inventoryId },
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
      [
        "Clave",
        getValue(resguardo.usuarioTitular?.neyemp || draft.usuarioTitularId),
      ],
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
      leadDetails: [
        titularPuesto,
        titularEmail === EMPTY_VALUE ? "" : titularEmail,
      ],
      sideImageDataUrl: qrDataUrl,
      sideImageSize: 36,
    },
  );

  y = drawCompactFields(doc, y, "Equipo asignado", [
    [
      "Tipo de bien",
      getValue(resguardo.tipoBien?.descTipoBien || draft.tipoBienLabel),
    ],
    ["Marca", getValue(getMarcaLabel(resguardo.marca) || draft.marca)],
    ["Modelo", getValue(resguardo.modelo?.descModelo || draft.modeloLabel)],
    ["N. serie", getValue(resguardo.numeroSerie || draft.numeroSerie)],
    [
      "Sistema operativo",
      getValue(
        resguardo.sistemaOperativo?.descSo || draft.sistemaOperativoLabel,
      ),
    ],
    [
      "Procesador",
      getValue(
        resguardo.procesador?.descProcesador || draft.procesadorLabel,
      ),
    ],
    [
      "Color / material",
      getValue(
        resguardo.colorMaterial?.descMaterial || draft.colorMaterialLabel,
      ),
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
  drawNormativeHeader(doc);
  drawNormativeBody(doc, fondoDataUrl, cintaDataUrl);
  drawNormativeFooter(doc);

  const blob = doc.output("blob");
  const filename = `RESG${getValue(resguardo.usuarioTitular?.neyemp).replace(/\s+/g, "")}-${folioId}.pdf`;
  const file = new File([blob], filename, { type: "application/pdf" });

  return {
    blob,
    file,
    filename,
  };
}
