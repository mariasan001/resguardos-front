import { backendRequest } from "@/lib/api/backend-client";
import type { Accesorio, CatalogosBundle, CatColorMaterial, CatModelo, CatProcesador, CatSo, CatTipoBien, Puesto } from "@/lib/types/api";

export function getAccesorios() {
  return backendRequest<Accesorio[]>("/api/catalogos/accesorios");
}

export function getColoresMateriales() {
  return backendRequest<CatColorMaterial[]>("/api/catalogos/colores");
}

export function getModelos() {
  return backendRequest<CatModelo[]>("/api/catalogos/modelos");
}

export function getProcesadores() {
  return backendRequest<CatProcesador[]>("/api/catalogos/procesadores");
}

export function getPuestos() {
  return backendRequest<Puesto[]>("/api/catalogos/puestos");
}

export function getSistemasOperativos() {
  return backendRequest<CatSo[]>("/api/catalogos/sistemas-operativos");
}

export function getTiposBien() {
  return backendRequest<CatTipoBien[]>("/api/catalogos/tipos-bien");
}

export async function getCatalogosBundle(): Promise<CatalogosBundle> {
  const [
    accesorios,
    colores,
    modelos,
    procesadores,
    puestos,
    sistemasOperativos,
    tiposBien,
  ] = await Promise.all([
    getAccesorios(),
    getColoresMateriales(),
    getModelos(),
    getProcesadores(),
    getPuestos(),
    getSistemasOperativos(),
    getTiposBien(),
  ]);

  return {
    accesorios,
    colores,
    modelos,
    procesadores,
    puestos,
    sistemasOperativos,
    tiposBien,
  };
}
