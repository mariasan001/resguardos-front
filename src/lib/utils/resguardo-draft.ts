import type { OptionItem, PreviewResguardoDraft } from "@/lib/types/api";

export const RESGUARDO_DRAFT_STORAGE_KEY = "previewResguardoDraft";
export const RESGUARDO_DRAFT_CHANGE_EVENT = "preview-resguardo-draft-change";

let cachedSerializedDraft: string | null | undefined;
let cachedParsedDraft: PreviewResguardoDraft | null = null;

export function getOptionLabel(options: OptionItem[], value?: string) {
  if (!value) {
    return "";
  }

  return options.find((option) => option.value === value)?.label ?? "";
}

export function readPreviewResguardoDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const serialized = window.localStorage.getItem(RESGUARDO_DRAFT_STORAGE_KEY);
  if (!serialized) {
    cachedSerializedDraft = null;
    cachedParsedDraft = null;
    return null;
  }

  if (serialized === cachedSerializedDraft) {
    return cachedParsedDraft;
  }

  try {
    cachedParsedDraft = JSON.parse(serialized) as PreviewResguardoDraft;
    cachedSerializedDraft = serialized;
    return cachedParsedDraft;
  } catch {
    cachedSerializedDraft = serialized;
    cachedParsedDraft = null;
    return null;
  }
}

export function writePreviewResguardoDraft(draft: PreviewResguardoDraft) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(draft);
  cachedSerializedDraft = serialized;
  cachedParsedDraft = draft;
  window.localStorage.setItem(RESGUARDO_DRAFT_STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(RESGUARDO_DRAFT_CHANGE_EVENT));
}

export function clearPreviewResguardoDraft() {
  if (typeof window === "undefined") {
    return;
  }

  cachedSerializedDraft = null;
  cachedParsedDraft = null;
  window.localStorage.removeItem(RESGUARDO_DRAFT_STORAGE_KEY);
  window.dispatchEvent(new Event(RESGUARDO_DRAFT_CHANGE_EVENT));
}

export function patchPreviewResguardoDraft(
  patch: Partial<PreviewResguardoDraft>,
) {
  const currentDraft = readPreviewResguardoDraft();

  if (!currentDraft) {
    return;
  }

  writePreviewResguardoDraft({
    ...currentDraft,
    ...patch,
  });
}

export function subscribePreviewResguardoDraft(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(RESGUARDO_DRAFT_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(RESGUARDO_DRAFT_CHANGE_EVENT, handleChange);
  };
}
