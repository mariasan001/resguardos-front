import type { Accesorio, Resguardo } from "@/lib/types/api";

/**
 * El backend regresa el accesorio del detalle solo con id y descripcion, asi que
 * la marca y el modelo se completan con el catalogo de accesorios.
 */
export function completeResguardoAccesorios(
  resguardo: Resguardo,
  catalogo: Accesorio[] = [],
): Resguardo {
  if (!resguardo.detalles?.length || !catalogo.length) {
    return resguardo;
  }

  const byId = new Map(
    catalogo
      .filter((item) => item.id !== undefined && item.id !== null)
      .map((item) => [String(item.id), item]),
  );

  return {
    ...resguardo,
    detalles: resguardo.detalles.map((detalle) => {
      const catalogItem = byId.get(String(detalle.accesorio?.id ?? ""));

      if (!catalogItem) {
        return detalle;
      }

      return {
        ...detalle,
        accesorio: {
          ...detalle.accesorio,
          descAccesorio:
            detalle.accesorio?.descAccesorio || catalogItem.descAccesorio,
          marca: detalle.accesorio?.marca ?? catalogItem.marca,
          modelo: detalle.accesorio?.modelo ?? catalogItem.modelo,
          idMarca: detalle.accesorio?.idMarca ?? catalogItem.idMarca,
        },
      };
    }),
  };
}
