import type { Resguardo } from "@/lib/types/api";

export const INVENTORY_PREFIX = "DGP-INV-";
const INVENTORY_DIGITS = 7;
const INVENTORY_PATTERN = /^DGP-INV-(\d{7,})$/i;

export function formatInventoryId(sequence: number) {
  return `${INVENTORY_PREFIX}${String(sequence).padStart(INVENTORY_DIGITS, "0")}`;
}

export function isValidInventoryId(value: string | undefined | null) {
  return Boolean(value?.trim() && INVENTORY_PATTERN.test(value.trim()));
}

function normalizeInventoryId(value: string) {
  return value.trim().toUpperCase();
}

export function getTakenInventoryIds(resguardos: Resguardo[]) {
  const taken = new Set<string>();

  for (const resguardo of resguardos) {
    const id = resguardo.idInventario?.trim();
    if (id) {
      taken.add(normalizeInventoryId(id));
    }
  }

  return taken;
}

export function getNextInventoryId(resguardos: Resguardo[]) {
  const highestSequence = resguardos.reduce((highest, resguardo) => {
    const match = resguardo.idInventario?.trim().match(INVENTORY_PATTERN);
    const sequence = match ? Number(match[1]) : 0;

    return Number.isSafeInteger(sequence) && sequence > highest
      ? sequence
      : highest;
  }, 0);

  return formatInventoryId(highestSequence + 1);
}

/**
 * Resuelve el folio de inventario para un alta.
 * Prefiere el valor del cliente si es válido y libre; si no, calcula el siguiente.
 *
 * Nota: la asignación atómica multi-instancia debe vivir en el backend.
 * Aquí solo evitamos sobrescribir un folio libre ya capturado en el formulario
 * y no usamos un lock in-process (falso sentido de seguridad en cluster).
 */
export function resolveInventoryId(
  candidate: string | undefined,
  existingResguardos: Resguardo[],
) {
  const taken = getTakenInventoryIds(existingResguardos);
  const trimmed = candidate?.trim();

  if (trimmed && isValidInventoryId(trimmed) && !taken.has(normalizeInventoryId(trimmed))) {
    return trimmed;
  }

  return getNextInventoryId(existingResguardos);
}
