import type { Accesorio, Resguardo } from "@/lib/types/api";

/**
 * Completa solo la descripcion del tipo de accesorio desde el catalogo.
 * Marca y modelo viven en el detalle del resguardo, no en el catalogo.
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
        },
      };
    }),
  };
}
