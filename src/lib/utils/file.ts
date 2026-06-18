export async function dataUrlToFile(
  dataUrl: string,
  filename: string,
  fallbackType = "image/png",
) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], filename, {
    type: blob.type || fallbackType,
  });
}

export async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No fue posible leer el archivo de firma."));
    reader.readAsDataURL(blob);
  });
}
