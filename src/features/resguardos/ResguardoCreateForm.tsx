"use client";

import { useEffect } from "react";

import {
  clearPreviewResguardoDraft,
  writePreviewResguardoDraft,
} from "@/lib/utils/resguardo-draft";
import {
  useIsHydrated,
  usePreviewResguardoDraft,
} from "@/lib/utils/use-preview-resguardo-draft";

import { ResguardoCreateFormContent } from "./create-form/ResguardoCreateFormContent";
import type { ResguardoCreateFormProps } from "./create-form/types";

export type { ResguardoCreateFormProps };

export default function ResguardoCreateForm(props: ResguardoCreateFormProps) {
  const { preserveDraft = false, serverDraft = null } = props;
  const hydrated = useIsHydrated();
  const draft = usePreviewResguardoDraft();
  const effectiveDraft = serverDraft ?? (preserveDraft ? draft : null);
  const formKey = serverDraft
    ? `edit-${serverDraft.editingResguardoId ?? "draft"}`
    : hydrated && effectiveDraft
      ? "draft-loaded"
      : "draft-empty";

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (serverDraft) {
      // El resguardo recien cargado reemplaza cualquier borrador anterior.
      writePreviewResguardoDraft(serverDraft);
      return;
    }

    if (preserveDraft) {
      return;
    }

    clearPreviewResguardoDraft();
  }, [hydrated, preserveDraft, serverDraft]);

  return (
    <ResguardoCreateFormContent
      key={formKey}
      {...props}
      initialDraft={serverDraft ?? (hydrated ? effectiveDraft : null)}
    />
  );
}
