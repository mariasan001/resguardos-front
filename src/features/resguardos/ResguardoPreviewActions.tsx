"use client";

import ResguardoRecordActions from "@/features/resguardos/ResguardoRecordActions";
import { usePreviewResguardoDraft } from "@/lib/utils/use-preview-resguardo-draft";

export default function ResguardoPreviewActions() {
  const draft = usePreviewResguardoDraft();
  const editingResguardoId = draft?.editingResguardoId;

  return (
    <ResguardoRecordActions
      editHref={
        editingResguardoId
          ? `/resguardos/nuevo?continue=1&edit=${editingResguardoId}`
          : "/resguardos/nuevo?continue=1"
      }
      exitHref="/resguardos"
    />
  );
}
