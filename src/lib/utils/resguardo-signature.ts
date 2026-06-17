const SIGNATURE_STORAGE_PREFIX = "firma_resguardo_";

export function getResguardoSignatureKey(id: number) {
  return `${SIGNATURE_STORAGE_PREFIX}${id}`;
}

export function readResguardoSignature(id: number) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(getResguardoSignatureKey(id));
}

export function writeResguardoSignature(id: number, signatureDataUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getResguardoSignatureKey(id), signatureDataUrl);
}
