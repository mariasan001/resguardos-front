"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import { ApiError } from "@/lib/api/errors";
import {
  createCatalogItem,
  deleteCatalogItem,
  updateCatalogItem,
  type CatalogApiKey,
} from "@/lib/services/catalogos.service";
import { formatSentenceCase } from "@/lib/utils/format";

export type CatalogGroupId =
  | "tiposBien"
  | "marcas"
  | "modelos"
  | "sistemasOperativos"
  | "colores"
  | "procesadores"
  | "accesorios";

export interface CatalogMutationResult {
  success: boolean;
  message: string;
  item?: {
    id: string;
    label: string;
  };
}

const CATALOG_PATH: Record<CatalogGroupId, CatalogApiKey> = {
  tiposBien: "tipos-bien",
  marcas: "marcas",
  modelos: "modelos",
  sistemasOperativos: "sistemas-operativos",
  colores: "colores",
  procesadores: "procesadores",
  accesorios: "accesorios",
};

const LABEL_FIELD: Record<CatalogGroupId, string> = {
  tiposBien: "descTipoBien",
  marcas: "descMarca",
  modelos: "descModelo",
  sistemasOperativos: "descSo",
  colores: "descMaterial",
  procesadores: "descProcesador",
  accesorios: "descAccesorio",
};

function buildBody(groupId: CatalogGroupId, label: string) {
  const normalizedLabel = formatSentenceCase(label);
  const field = LABEL_FIELD[groupId];

  return {
    body: {
      [field]: normalizedLabel,
    },
    normalizedLabel,
  };
}

function mapError(
  error: unknown,
  fallback: string,
  operation: "save" | "delete" = "save",
) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return operation === "delete"
        ? "No se puede eliminar porque el elemento esta en uso."
        : "Ya existe un elemento con ese nombre.";
    }

    if (error.status === 404) {
      return "El registro ya no existe.";
    }

    return error.message || fallback;
  }

  return fallback;
}

function toItem(groupId: CatalogGroupId, payload: Record<string, unknown>, fallbackLabel: string) {
  const field = LABEL_FIELD[groupId];
  const label =
    typeof payload[field] === "string" && payload[field]
      ? String(payload[field])
      : fallbackLabel;

  return {
    id: String(payload.id ?? ""),
    label,
  };
}

export async function createCatalogAction(input: {
  groupId: CatalogGroupId;
  label: string;
}): Promise<CatalogMutationResult> {
  await requireRole([USER_ROLES.admin]);

  const { body, normalizedLabel } = buildBody(input.groupId, input.label);

  if (!normalizedLabel) {
    return { success: false, message: "Escribe un nombre para el nuevo elemento." };
  }

  try {
    const created = await createCatalogItem<Record<string, unknown>>(
      CATALOG_PATH[input.groupId],
      body,
    );
    revalidatePath("/catalogos");

    return {
      success: true,
      message: "Elemento creado.",
      item: toItem(input.groupId, created, normalizedLabel),
    };
  } catch (error) {
    return {
      success: false,
      message: mapError(error, "No fue posible crear el elemento."),
    };
  }
}

export async function updateCatalogAction(input: {
  groupId: CatalogGroupId;
  id: string;
  label: string;
}): Promise<CatalogMutationResult> {
  await requireRole([USER_ROLES.admin]);

  const { body, normalizedLabel } = buildBody(input.groupId, input.label);

  if (!normalizedLabel) {
    return { success: false, message: "El nombre no puede quedar vacío." };
  }

  try {
    const updated = await updateCatalogItem<Record<string, unknown>>(
      CATALOG_PATH[input.groupId],
      input.id,
      body,
    );
    revalidatePath("/catalogos");

    return {
      success: true,
      message: "Elemento actualizado.",
      item: toItem(input.groupId, updated, normalizedLabel),
    };
  } catch (error) {
    return {
      success: false,
      message: mapError(error, "No fue posible actualizar el elemento."),
    };
  }
}

export async function deleteCatalogAction(input: {
  groupId: CatalogGroupId;
  id: string;
}): Promise<CatalogMutationResult> {
  await requireRole([USER_ROLES.admin]);

  try {
    await deleteCatalogItem(CATALOG_PATH[input.groupId], input.id);
    revalidatePath("/catalogos");

    return { success: true, message: "Elemento eliminado." };
  } catch (error) {
    return {
      success: false,
      message: mapError(error, "No fue posible eliminar el elemento.", "delete"),
    };
  }
}
