import DefinitionList from "@/components/ui/DefinitionList";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatusBadge from "@/components/ui/StatusBadge";
import SendResguardoEmailForm from "@/features/email/SendResguardoEmailForm";
import ResguardoRecordActions from "@/features/resguardos/ResguardoRecordActions";
import ResguardoVerificationCard from "@/features/resguardos/ResguardoVerificationCard";
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
        eyebrow="Formato"
        title={`Resguardo ${formatText(resguardo.idInventario)}`}
        description="Revisa la informacion del equipo, valida la entrega y recaba la firma del titular."
      />

      <ResguardoRecordActions />

      <section className={styles.layout}>
        <div className={styles.mainColumn}>
          <ResguardoVerificationCard
            titular={formatText(resguardo.usuarioTitular?.nombre, "Titular asignado")}
            inventario={formatText(resguardo.idInventario)}
          />

          <Panel
            title="Datos del resguardo"
            description="Verifica que la informacion principal corresponda con la entrega."
          >
            <div className={styles.summary}>
              <div className={styles.summaryHeader}>
                <strong>{formatText(resguardo.marca)}</strong>
                <StatusBadge value={resguardo.idEstadoResguardo} />
              </div>
              <DefinitionList
                items={[
                  { label: "Inventario", value: formatText(resguardo.idInventario) },
                  { label: "Folio de resguardo", value: formatText(resguardo.resguardo) },
                  { label: "Fecha de asignacion", value: formatDate(resguardo.fechaAsignacion) },
                  { label: "Fecha de registro", value: formatDate(resguardo.fechaCreacion) },
                  { label: "Numero de serie", value: formatText(resguardo.numeroSerie) },
                  { label: "MAC", value: formatText(resguardo.mac) },
                  { label: "IP", value: formatText(resguardo.ip) },
                  { label: "Telefono", value: formatText(resguardo.telefono) },
                  { label: "Observaciones", value: formatText(resguardo.observaciones) },
                ]}
              />
            </div>
          </Panel>

          <Panel
            title="Responsables y recepcion"
            description="Personas involucradas en la asignacion del equipo."
          >
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
        </div>

        <aside className={styles.sideColumn}>
          <Panel
            title="Especificaciones del equipo"
            description="Datos tecnicos y clasificacion del resguardo."
          >
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

          <Panel
            title="Envio del formato"
            description="Adjunta el PDF oficial cuando el formato ya este validado y firmado."
          >
            <SendResguardoEmailForm resguardoId={Number(resguardo.id)} />
          </Panel>
        </aside>
      </section>
    </>
  );
}
