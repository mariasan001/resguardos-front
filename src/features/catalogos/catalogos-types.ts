import type { CatalogGroupId } from "@/features/catalogos/actions";

export type { CatalogGroupId };

export interface CatalogItem {
  id: string;
  label: string;
  marca?: string;
  marcaId?: string;
  modelo?: string;
}

export interface CatalogGroup {
  id: CatalogGroupId;
  label: string;
  description: string;
  singular: string;
  items: CatalogItem[];
}
