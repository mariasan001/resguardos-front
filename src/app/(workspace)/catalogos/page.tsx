import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { getCatalogosBundle } from "@/lib/services/catalogos.service";
import { formatText } from "@/lib/utils/format";
import styles from "@/app/(workspace)/catalogos/page.module.css";

function CatalogList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Panel title={title} description={`${items.length} elemento(s) disponibles.`}>
      <ul className={styles.list}>
        {items.length ? (
          items.map((item) => <li key={item}>{item}</li>)
        ) : (
          <li>Sin registros cargados.</li>
        )}
      </ul>
    </Panel>
  );
}

export default async function CatalogosPage() {
  const catalogos = await getCatalogosBundle();

  return (
    <>
      <PageHeader
        eyebrow="Catálogos"
        title="Maestros de captura"
        description="Vista consolidada de catálogos usados para formularios, clasificación y consistencia operativa."
      />

      <section className={styles.grid}>
        <CatalogList
          title="Tipos de bien"
          items={catalogos.tiposBien.map((item) => formatText(item.descTipoBien))}
        />
        <CatalogList
          title="Modelos"
          items={catalogos.modelos.map((item) => formatText(item.descModelo))}
        />
        <CatalogList
          title="Sistemas operativos"
          items={catalogos.sistemasOperativos.map((item) => formatText(item.descSo))}
        />
        <CatalogList
          title="Colores y materiales"
          items={catalogos.colores.map((item) => formatText(item.descMaterial))}
        />
        <CatalogList
          title="Procesadores"
          items={catalogos.procesadores.map((item) => formatText(item.descProcesador))}
        />
        <CatalogList
          title="Accesorios"
          items={catalogos.accesorios.map((item) => formatText(item.descAccesorio))}
        />
      </section>
    </>
  );
}
