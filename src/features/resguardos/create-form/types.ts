import type { ChangeEventHandler } from "react";

import type {
  PreviewResguardoDraft,
  ResguardoCatalogSources,
  SelectOptionsSource,
} from "@/lib/types/api";

export type SectionKey =
  | "equipo"
  | "tecnico"
  | "responsable"
  | "ubicacion"
  | "control"
  | "extras";

export interface DetalleItem {
  id: string;
  accesorioId: string;
  numeroSerie: string;
}

export interface ResguardoCreateFormProps {
  sources: ResguardoCatalogSources;
  cancelHref?: string;
  preserveDraft?: boolean;
  serverDraft?: PreviewResguardoDraft | null;
  generatedInventoryId: string;
}

export interface ResguardoCreateFormContentProps extends ResguardoCreateFormProps {
  initialDraft: PreviewResguardoDraft | null;
}

export interface BaseFieldProps {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  span?: "full" | "half" | "third" | "quarter" | "twoThirds";
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
}

export interface SelectFieldProps extends BaseFieldProps {
  source: SelectOptionsSource;
}

export interface SectionStatus {
  completed: number;
  total: number;
}
