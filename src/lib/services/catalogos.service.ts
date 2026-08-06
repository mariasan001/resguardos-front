import "server-only";

import { serverBackendRequest } from "@/lib/api/server-backend";
import type {
  Accesorio,
  CatalogosBundle,
  CatColorMaterial,
  CatMarca,
  CatModelo,
  CatProcesador,
  CatSo,
  CatTipoBien,
  Puesto,
} from "@/lib/types/api";

export type CatalogApiKey =
  | "accesorios"
  | "colores"
  | "marcas"
  | "modelos"
  | "procesadores"
  | "puestos"
  | "sistemas-operativos"
  | "tipos-bien";

export function getAccesorios() {
  return serverBackendRequest<Accesorio[]>("/api/catalogos/accesorios");
}

export function getColoresMateriales() {
  return serverBackendRequest<CatColorMaterial[]>("/api/catalogos/colores");
}

export function getMarcas() {
  return serverBackendRequest<CatMarca[]>("/api/catalogos/marcas");
}

export function getModelos() {
  return serverBackendRequest<CatModelo[]>("/api/catalogos/modelos");
}

export function getProcesadores() {
  return serverBackendRequest<CatProcesador[]>("/api/catalogos/procesadores");
}

export function getPuestos() {
  return serverBackendRequest<Puesto[]>("/api/catalogos/puestos");
}

export function getSistemasOperativos() {
  return serverBackendRequest<CatSo[]>("/api/catalogos/sistemas-operativos");
}

export function getTiposBien() {
  return serverBackendRequest<CatTipoBien[]>("/api/catalogos/tipos-bien");
}

export async function getCatalogosBundle(): Promise<CatalogosBundle> {
  const [
    accesorios,
    colores,
    marcas,
    modelos,
    procesadores,
    puestos,
    sistemasOperativos,
    tiposBien,
  ] = await Promise.all([
    getAccesorios(),
    getColoresMateriales(),
    getMarcas(),
    getModelos(),
    getProcesadores(),
    getPuestos(),
    getSistemasOperativos(),
    getTiposBien(),
  ]);

  return {
    accesorios,
    colores,
    marcas,
    modelos,
    procesadores,
    puestos,
    sistemasOperativos,
    tiposBien,
  };
}

export function createCatalogItem<T>(
  catalog: CatalogApiKey,
  body: Record<string, unknown>,
) {
  return serverBackendRequest<T>(`/api/catalogos/${catalog}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function updateCatalogItem<T>(
  catalog: CatalogApiKey,
  id: string | number,
  body: Record<string, unknown>,
) {
  return serverBackendRequest<T>(`/api/catalogos/${catalog}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteCatalogItem(catalog: CatalogApiKey, id: string | number) {
  return serverBackendRequest<null>(`/api/catalogos/${catalog}/${id}`, {
    method: "DELETE",
    parse: "text",
  });
}
