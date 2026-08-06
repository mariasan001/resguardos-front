import type { Accesorio, Resguardo } from "@/lib/types/api";

/**
 * El backend suele devolver el accesorio del detalle solo con id y descripcion.
 * Marca y modelo se toman del catalogo para no conservar valores viejos o
 * incorrectos (p. ej. el modelo del equipo pegado en todos los detalles).
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
          marca: catalogItem.marca ?? detalle.accesorio?.marca,
          modelo: catalogItem.modelo ?? detalle.accesorio?.modelo,
          idMarca: catalogItem.idMarca ?? detalle.accesorio?.idMarca,
        },
      };
    }),
  };
}
