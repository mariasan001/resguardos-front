import type { jsPDF } from "jspdf";

import { EMPTY_VALUE } from "./constants";

const assetCache = new Map<string, Promise<string>>();
const binaryAssetCache = new Map<string, Promise<string>>();

export function getValue(value?: string | number | null) {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }

  const text = String(value).trim();
  return text || EMPTY_VALUE;
}

export function formatCompactDate(value?: string) {
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

export function getAssetDataUrl(path: string) {
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
          reader.onerror = () =>
            reject(new Error(`No fue posible leer el recurso ${path}.`));
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

export function getBinaryAsset(path: string) {
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

export function setFont(doc: jsPDF, style: "normal" | "bold", size: number) {
  doc.setFont("Poppins", style);
  doc.setFontSize(size);
}

export function registerPoppinsFonts(
  doc: jsPDF,
  regularFont: string,
  boldFont: string,
) {
  doc.addFileToVFS("Poppins-Regular.ttf", regularFont);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  doc.addFileToVFS("Poppins-Bold.ttf", boldFont);
  doc.addFont("Poppins-Bold.ttf", "Poppins", "bold");
}
