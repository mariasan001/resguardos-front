import Link from "next/link";

import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { getResguardoCount, getResguardos } from "@/lib/services/resguardos.service";
import { getUsuarios } from "@/lib/services/usuarios.service";
import { formatDate, formatText, getEstadoLabel } from "@/lib/utils/format";
import { ROUTES } from "@/lib/utils/routes";
import styles from "@/app/(workspace)/page.module.css";

export default async function DashboardPage() {
  const [usuarios, resguardos, totalResguardos] = await Promise.all([
    getUsuarios(),
    getResguardos(),
    getResguardoCount(),
  ]);

  const activos = resguardos.filter((item) => item.idEstadoResguardo === 1).length;
  const recientes = [...resguardos]
    .sort((a, b) => {
      const left = new Date(b.fechaCreacion ?? b.fechaAsignacion ?? 0).getTime();
      const right = new Date(a.fechaCreacion ?? a.fechaAsignacion ?? 0).getTime();
      return left - right;
    })
    .slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Resumen general"
        description="Vista general del sistema."
        actionHref={ROUTES.resguardosNuevo}
        actionLabel="Registrar resguardo"
      />

      <section className={styles.stats}>
        <StatCard
          label="Resguardos registrados"
          value={String(totalResguardos)}
          helper="Total"
          icon="resguardos"
        />
        <StatCard
          label="Resguardos activos"
          value={String(activos)}
          helper="Activos"
          icon="activos"
        />
        <StatCard
          label="Usuarios disponibles"
          value={String(usuarios.length)}
          helper="Usuarios"
          icon="usuarios"
        />
      </section>

      <section className={styles.grid}>
        <Panel title="Acciones" description="Accesos rapidos.">
          <div className={styles.actionList}>
            <Link href={ROUTES.resguardosNuevo} className={styles.actionCard}>
              <strong>Alta de resguardo</strong>
              <span>Nuevo registro</span>
            </Link>
            <Link href={ROUTES.resguardos} className={styles.actionCard}>
              <strong>Consultar resguardos</strong>
              <span>Ver listado</span>
            </Link>
            <Link href={ROUTES.usuarios} className={styles.actionCard}>
              <strong>Actualizar contacto</strong>
              <span>Editar correo</span>
            </Link>
          </div>
        </Panel>

        <Panel title="Estado" description="Resumen tecnico.">
          <ul className={styles.notes}>
            <li>API conectada</li>
            <li>Tipos listos</li>
            <li>Servicios separados de UI</li>
          </ul>
        </Panel>
      </section>

      <Panel title="Recientes" description="Ultimos registros.">
        <div className={styles.recentList}>
          {recientes.length ? (
            recientes.map((resguardo) => (
              <Link
                key={String(resguardo.id)}
                href={`/resguardos/${resguardo.id}`}
                className={styles.recentItem}
              >
                <div className={styles.recentTop}>
                  <strong>{formatText(resguardo.idInventario)}</strong>
                  <StatusBadge value={resguardo.idEstadoResguardo} />
                </div>
                <p>{formatText(resguardo.usuarioTitular?.nombre)}</p>
                <span>
                  {formatText(resguardo.marca)} · {getEstadoLabel(resguardo.idEstadoResguardo)}
                </span>
                <small>{formatDate(resguardo.fechaCreacion ?? resguardo.fechaAsignacion)}</small>
              </Link>
            ))
          ) : (
            <p className={styles.emptyText}>Sin registros.</p>
          )}
        </div>
      </Panel>
    </>
  );
}
