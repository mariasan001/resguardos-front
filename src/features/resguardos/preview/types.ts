export type SubmissionStage =
  | "idle"
  | "saving_resguardo"
  | "uploading_firma"
  | "success"
  | "signature_error";

export type EditSignatureMode = "choose" | "saved" | "new";

export interface SignatureRetryState {
  createdResguardoId: number;
  signatureFile: File;
}

export interface GeneratedPdfState {
  blob: Blob;
  file: File;
  filename: string;
  url: string;
  resguardoId: number;
}
