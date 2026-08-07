import type { OptionItem } from "@/lib/types/api";

/**
 * Nombre completo del asignador fijo.
 * La busqueda en usuarios exige coincidencia exacta de este nombre completo
 * (ignorando mayusculas y acentos), porque puede haber homonimos parciales.
 * Hoy puede no existir en la BD; cuando lo den de alta con este nombre exacto,
 * el front tomara su neyemp al guardar.
 */
export const FIXED_ASSIGN_USER_NAME = "Carlos Augusto Nuñez Mancilla";

function normalizePersonName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-MX")
    .replace(/\s+/g, " ")
    .trim();
}

/** Solo acepta el nombre completo exacto; no busca coincidencias parciales. */
export function findAssignerNeyemp(users: OptionItem[]) {
  const target = normalizePersonName(FIXED_ASSIGN_USER_NAME);

  const matches = users.filter(
    (user) => normalizePersonName(user.label) === target,
  );

  if (matches.length !== 1) {
    return "";
  }

  return matches[0]?.value ?? "";
}
