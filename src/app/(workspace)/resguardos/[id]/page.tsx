import DefinitionList from "@/components/ui/DefinitionList";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatusBadge from "@/components/ui/StatusBadge";
import SendResguardoEmailForm from "@/features/email/SendResguardoEmailForm";
import { getResguardoById } from "@/lib/services/resguardos.service";
import { formatDate, formatText } from "@/lib/utils/format";
import styles from "@/app/(workspace)/resguardos/[id]/page.module.css";

interface ResguardoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResguardoDetailPage({
  params,
}: ResguardoDetailPageProps) {
  const { id } = await params;
  const resguardo = await getResguardoById(Number(id));

  return (
    <>
      <PageHeader
        eyebrow="Detalle"
        title={`Resguardo ${formatText(resguardo.idInventario)}`}
        description="Vista de trazabilidad del equipo, responsables, metadatos técnicos y flujo de envío por correo con PDF adjunto."
      />

      <section className={styles.grid}>
        <Panel title="Resumen operativo" description="Información principal del registro">
          <div className={styles.summary}>
            <div className={styles.summaryHeader}>
              <strong>{formatText(resguardo.marca)}</strong>
              <StatusBadge value={resguardo.idEstadoResguardo} />
            </div>
            <DefinitionList
              items={[
                { label: "Inventario", value: formatText(resguardo.idInventario) },
                { label: "Folio resguardo", value: formatText(resguardo.resguardo) },
                { label: "Asignación", value: formatDate(resguardo.fechaAsignacion) },
                { label: "Creación", value: formatDate(resguardo.fechaCreacion) },
                { label: "Serie", value: formatText(resguardo.numeroSerie) },
                { label: "MAC", value: formatText(resguardo.mac) },
                { label: "IP", value: formatText(resguardo.ip) },
                { label: "Teléfono", value: formatText(resguardo.telefono) },
                { label: "Observaciones", value: formatText(resguardo.observaciones) },
              ]}
            />
          </div>
        </Panel>

        <Panel
          title="Flujo de correo"
          description="Sube el PDF oficial del resguardo para delegar el envío al backend."
        >
          <SendResguardoEmailForm resguardoId={Number(resguardo.id)} />
        </Panel>
      </section>

      <section className={styles.grid}>
        <Panel title="Responsables" description="Usuarios asociados al resguardo">
          <DefinitionList
            items={[
              {
                label: "Titular",
                value: `${formatText(resguardo.usuarioTitular?.nombre)} · ${formatText(
                  resguardo.usuarioTitular?.neyemp,
                )}`,
              },
              {
                label: "Resguarda",
                value: `${formatText(resguardo.usuarioResguarda?.nombre)} · ${formatText(
                  resguardo.usuarioResguarda?.neyemp,
                )}`,
              },
              {
                label: "Asigna",
                value: `${formatText(resguardo.usuarioAsigna?.nombre)} · ${formatText(
                  resguardo.usuarioAsigna?.neyemp,
                )}`,
              },
            ]}
          />
        </Panel>

        <Panel title="Clasificación técnica" description="Catálogos y accesorios vinculados">
          <DefinitionList
            items={[
              {
                label: "Tipo de bien",
                value: formatText(resguardo.tipoBien?.descTipoBien),
              },
              {
                label: "Modelo",
                value: formatText(resguardo.modelo?.descModelo),
              },
              {
                label: "Sistema operativo",
                value: formatText(resguardo.sistemaOperativo?.descSo),
              },
              {
                label: "Color / material",
                value: formatText(resguardo.colorMaterial?.descMaterial),
              },
              {
                label: "Procesador",
                value: formatText(resguardo.procesador?.descProcesador),
              },
              {
                label: "Accesorios",
                value: resguardo.detalles?.length ? (
                  <ul className={styles.accessories}>
                    {resguardo.detalles.map((detalle, index) => (
                      <li key={`${detalle.accesorio?.id}-${index}`}>
                        {formatText(detalle.accesorio?.descAccesorio)} · Serie:{" "}
                        {formatText(detalle.numeroSerie)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "Sin accesorios registrados"
                ),
              },
            ]}
          />
        </Panel>
      </section>
    </>
  );
}
