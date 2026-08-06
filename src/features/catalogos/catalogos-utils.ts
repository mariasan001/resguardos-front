import {
  Boxes,
  Cpu,
  Keyboard,
  Layers,
  MonitorSmartphone,
  Palette,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CatalogGroupId } from "@/features/catalogos/actions";

export const GROUP_ICONS: Record<CatalogGroupId, LucideIcon> = {
  tiposBien: Boxes,
  marcas: Tag,
  modelos: Layers,
  sistemasOperativos: MonitorSmartphone,
  colores: Palette,
  procesadores: Cpu,
  accesorios: Keyboard,
};

export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
