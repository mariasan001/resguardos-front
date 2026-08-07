import PageHeader from "@/components/ui/PageHeader";
import CatalogosExplorer, {
  type CatalogGroup,
} from "@/features/catalogos/CatalogosExplorer";
import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import { getCatalogosBundle } from "@/lib/services/catalogos.service";
import { formatText } from "@/lib/utils/format";

export default async function CatalogosPage() {
  await requireRole([USER_ROLES.admin]);
  const catalogos = await getCatalogosBundle();

  const groups: CatalogGroup[] = [
    {
      id: "tiposBien",
      label: "Tipos de bien",
      singular: "tipo de bien",
      description: "Clasificacion principal del equipo resguardado.",
      items: catalogos.tiposBien.map((item) => ({
        id: String(item.id ?? ""),
        label: formatText(item.descTipoBien),
      })),
    },
    {
      id: "marcas",
      label: "Marcas",
      singular: "marca",
      description: "Fabricantes disponibles para equipos y accesorios.",
      items: catalogos.marcas.map((item) => ({
        id: String(item.id ?? ""),
        label: formatText(item.descMarca),
      })),
    },
    {
      id: "modelos",
      label: "Modelos",
      singular: "modelo",
      description: "Modelos asociados a cada marca disponible.",
      items: catalogos.modelos.map((item) => ({
        id: String(item.id ?? ""),
        label: formatText(item.descModelo),
      })),
    },
    {
      id: "sistemasOperativos",
      label: "Sistemas operativos",
      singular: "sistema operativo",
      description: "Plataformas instaladas en los equipos de computo.",
      items: catalogos.sistemasOperativos.map((item) => ({
        id: String(item.id ?? ""),
        label: formatText(item.descSo),
      })),
    },
    {
      id: "colores",
      label: "Colores y materiales",
      singular: "color o material",
      description: "Acabados usados para identificar fisicamente el bien.",
      items: catalogos.colores.map((item) => ({
        id: String(item.id ?? ""),
        label: formatText(item.descMaterial),
      })),
    },
    {
      id: "procesadores",
      label: "Procesadores",
      singular: "procesador",
      description: "Capacidad de computo registrada por equipo.",
      items: catalogos.procesadores.map((item) => ({
        id: String(item.id ?? ""),
        label: formatText(item.descProcesador),
      })),
    },
    {
      id: "accesorios",
      label: "Accesorios",
      singular: "accesorio",
      description:
        "Tipo de complemento. La marca y el modelo se capturan en el detalle del resguardo.",
      items: catalogos.accesorios.map((item) => ({
        id: String(item.id ?? ""),
        label: formatText(item.descAccesorio),
      })),
    },
  ];

  return (
    <>
      <PageHeader
        plain
        compact
        title="Catálogos"
        description="Administra los valores disponibles en los formularios de resguardo."
      />

      <CatalogosExplorer groups={groups} />
    </>
  );
}
