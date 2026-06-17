import Link from "next/link";
import {
  AlertCircle,
  Files,
  Funnel,
  Plus,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { getResguardos } from "@/lib/services/resguardos.service";
import { filterResguardos, formatDate, formatText } from "@/lib/utils/format";
import styles from "@/app/(resguardos-list)/resguardos/page.module.css";

interface ResguardosPageProps {
  searchParams: Promise<{
    q?: string;
    estado?: string;
  }>;
}

function getStatusCounts(total: Awaited<ReturnType<typeof getResguardos>>) {
  const activos = total.filter((item) => item.idEstadoResguardo === 1).length;
  const devueltos = total.filter((item) => item.idEstadoResguardo === 2).length;
  const cancelados = total.filter((item) => item.idEstadoResguardo === 3).length;

  return {
    total: total.length,
    activos,
    devueltos,
    cancelados,
  };
}

export default async function ResguardosPage({
  searchParams,
}: ResguardosPageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const estado = params.estado ?? "";
  const resguardos = await getResguardos();
  const filtered = filterResguardos(resguardos, q, estado);
  const counts = getStatusCounts(resguardos);
  const hasActiveFilters = Boolean(q.trim() || estado);

  const summaryCards = [
    {
      label: "Total de resguardos",
      value: counts.total,
      helper: "Base actual",
      state: "General",
      tone: styles.toneNeutral,
      icon: Files,
    },
    {
      label: "Activos",
      value: counts.activos,
      helper: "En resguardo vigente",
      state: "Operacion",
      tone: styles.toneSuccess,
      icon: ShieldCheck,
    },
    {
      label: "Devueltos",
      value: counts.devueltos,
      helper: "Con cierre de asignacion",
      state: "Seguimiento",
      tone: styles.toneWarning,
      icon: RotateCcw,
    },
    {
      label: "Cancelados",
      value: counts.cancelados,
      helper: "Fuera de operacion",
      state: "Control",
      tone: styles.toneDanger,
      icon: AlertCircle,
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Resguardos</h1>
          <p className={styles.description}>
            Consulta, filtros y seguimiento de resguardos.
          </p>
        </div>

        <Link href="/resguardos/nuevo" className={styles.primaryAction}>
          <Plus size={16} strokeWidth={2} />
          Nuevo resguardo
        </Link>
      </div>

      <section className={styles.stats}>
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className={`${styles.statCard} ${card.tone}`}>
              <div className={styles.statTop}>
                <span className={styles.statIconWrap}>
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className={styles.statState}>{card.state}</span>
              </div>

              <div className={styles.statBody}>
                <span className={styles.statLabel}>{card.label}</span>
                <strong className={styles.statValue}>{card.value}</strong>
              </div>

              <p className={styles.statHelper}>{card.helper}</p>
            </article>
          );
        })}
      </section>

      <section className={styles.toolbar}>
        <form className={styles.filters}>
          <label className={styles.field}>
            <span>Buscar</span>
            <input
              className={styles.input}
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Inventario, marca, serie o titular"
            />
          </label>

          <label className={styles.field}>
            <span>Estado</span>
            <select className={styles.input} name="estado" defaultValue={estado}>
              <option value="">Todos</option>
              <option value="1">Activo</option>
              <option value="2">Devuelto</option>
              <option value="3">Cancelado</option>
            </select>
          </label>

          <div className={styles.filterActions}>
            <button type="submit" className={styles.filterButton}>
              <Funnel size={16} strokeWidth={2} />
              Aplicar
            </button>
            <Link href="/resguardos" className={styles.secondaryAction}>
              Limpiar
            </Link>
          </div>
        </form>
      </section>

      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <div>
            <h2 className={styles.listTitle}>Listado de resguardos</h2>
            <p className={styles.listDescription}>
              {filtered.length} registro(s) visibles.
            </p>
          </div>
        </div>

        <DataTable
          data={filtered}
          keyExtractor={(item) => String(item.id ?? item.idInventario)}
          emptyTitle="Sin coincidencias"
          emptyDescription="No hay resguardos con los filtros actuales."
          emptyContent={
            resguardos.length === 0 ? (
              <EmptyState
                title="Aun no hay resguardos"
                description="Registra el primer resguardo para comenzar el seguimiento."
                actions={
                  <Link href="/resguardos/nuevo" className={styles.primaryAction}>
                    <Plus size={16} strokeWidth={2} />
                    Nuevo resguardo
                  </Link>
                }
              />
            ) : hasActiveFilters ? (
              <EmptyState
                title="Sin resultados"
                description="No se encontraron resguardos con los filtros actuales."
                actions={
                  <Link href="/resguardos" className={styles.secondaryAction}>
                    Limpiar filtros
                  </Link>
                }
              />
            ) : undefined
          }
          columns={[
            {
              key: "inventario",
              header: "Inventario",
              render: (item) => (
                <div className={styles.cell}>
                  <Link href={`/resguardos/${item.id}`} className={styles.primaryLink}>
                    {formatText(item.idInventario)}
                  </Link>
                  <span>{formatText(item.marca)}</span>
                </div>
              ),
            },
            {
              key: "titular",
              header: "Titular",
              render: (item) => (
                <div className={styles.cell}>
                  <strong>{formatText(item.usuarioTitular?.nombre)}</strong>
                  <span>{formatText(item.usuarioTitular?.neyemp)}</span>
                </div>
              ),
            },
            {
              key: "serie",
              header: "Serie / Red",
              render: (item) => (
                <div className={styles.cell}>
                  <strong>{formatText(item.numeroSerie)}</strong>
                  <span>{formatText(item.ip)}</span>
                </div>
              ),
            },
            {
              key: "fecha",
              header: "Asignacion",
              render: (item) => formatDate(item.fechaAsignacion),
            },
            {
              key: "estado",
              header: "Estado",
              render: (item) => <StatusBadge value={item.idEstadoResguardo} />,
            },
          ]}
        />
      </section>
    </section>
  );
}
