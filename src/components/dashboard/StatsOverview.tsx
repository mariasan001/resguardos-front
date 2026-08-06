import StatCard from "@/components/ui/StatCard";
import type { Resguardo } from "@/lib/types/api";
import {
  countActiveHolders,
  countByEstadoId,
  toPercentage,
} from "@/lib/utils/dashboard";
import styles from "@/components/dashboard/StatsOverview.module.css";

interface StatsOverviewProps {
  resguardos: Resguardo[];
  usuariosCount: number;
  activeEstado?: string;
  buildFilterHref?: (estado?: string) => string;
}

function defaultFilterHref(estado?: string) {
  return estado ? `/resguardos?estado=${estado}` : "/resguardos";
}

export default function StatsOverview({
  resguardos,
  usuariosCount,
  activeEstado = "",
  buildFilterHref = defaultFilterHref,
}: StatsOverviewProps) {
  const activos = countByEstadoId(resguardos, 1);
  const titularesConResguardoActivo = countActiveHolders(resguardos);
  const modificados = countByEstadoId(resguardos, 2);
  const dadosDeBaja = countByEstadoId(resguardos, 3);

  const registrosHref = buildFilterHref();
  const modificadosHref =
    activeEstado === "2" ? registrosHref : buildFilterHref("2");
  const bajaHref =
    activeEstado === "3" ? registrosHref : buildFilterHref("3");

  return (
    <section className={styles.kpis} aria-label="Indicadores principales">
      <StatCard
        label="Usuarios"
        value={String(usuariosCount)}
        helper="Registrados en el directorio"
        icon="usuarios"
        tone="brand"
      />
      <StatCard
        label="Registros"
        value={String(resguardos.length)}
        helper={`Resguardos capturados, ${activos} vigentes en ${titularesConResguardoActivo} titulares`}
        icon="resguardos"
        tone="success"
        href={registrosHref}
        selected={!activeEstado}
      />
      <StatCard
        label="Modificados"
        value={String(modificados)}
        helper={`Resguardos modificados, de ${resguardos.length} registros`}
        icon="modificados"
        tone="warning"
        progress={toPercentage(modificados, resguardos.length)}
        href={modificadosHref}
        selected={activeEstado === "2"}
      />
      <StatCard
        label="Dados de baja"
        value={String(dadosDeBaja)}
        helper={`Resguardos dados de baja, de ${resguardos.length} registros`}
        icon="baja"
        tone="danger"
        progress={toPercentage(dadosDeBaja, resguardos.length)}
        href={bajaHref}
        selected={activeEstado === "3"}
      />
    </section>
  );
}
