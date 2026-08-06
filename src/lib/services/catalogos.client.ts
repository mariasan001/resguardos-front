import type { Accesorio } from "@/lib/types/api";

/** Cliente: el catalogo completa la marca y el modelo que el detalle no trae. */
export async function getAccesoriosCatalog(): Promise<Accesorio[]> {
  try {
    const response = await fetch("/api/catalogos/accesorios", {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();
    return Array.isArray(payload) ? (payload as Accesorio[]) : [];
  } catch {
    return [];
  }
}
