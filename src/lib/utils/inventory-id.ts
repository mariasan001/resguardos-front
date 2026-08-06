import type { Resguardo } from "@/lib/types/api";

export const INVENTORY_PREFIX = "DGP-INV-";
const INVENTORY_DIGITS = 7;
const INVENTORY_PATTERN = /^DGP-INV-(\d{7,})$/i;

export function formatInventoryId(sequence: number) {
  return `${INVENTORY_PREFIX}${String(sequence).padStart(INVENTORY_DIGITS, "0")}`;
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
