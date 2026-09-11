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
  if (estado === "3") {
    return "/bajas";
  }
  return estado ? `/resguardos?estado=${estado}` : "/resguardos";
}

export default function StatsOverview({
  resguardos,
  usuariosCount,
  activeEstado = "",
  buildFilterHref = defaultFilterHref,
}: StatsOverviewProps) {
  const dadosDeBaja = countByEstadoId(resguardos, 3);
  const vigentes = resguardos.length - dadosDeBaja;
  const activos = countByEstadoId(resguardos, 1);
  const titularesConResguardoActivo = countActiveHolders(resguardos);
  const modificados = countByEstadoId(resguardos, 2);

  const registrosHref = buildFilterHref();
  const modificadosHref =
    activeEstado === "2" ? registrosHref : buildFilterHref("2");
  // Bajas es sección propia: el KPI siempre lleva a /bajas (no “limpia” el filtro).
  const bajaHref = buildFilterHref("3");

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
        value={String(vigentes)}
        helper={`${activos} vigentes en ${titularesConResguardoActivo} titulares · ${resguardos.length} capturados`}
        icon="resguardos"
        tone="success"
        href={registrosHref}
        selected={!activeEstado}
      />
      <StatCard
        label="Modificados"
        value={String(modificados)}
        helper={`De ${vigentes} registros activos`}
        icon="modificados"
        tone="warning"
        progress={toPercentage(modificados, vigentes)}
        href={modificadosHref}
        selected={activeEstado === "2"}
      />
      <StatCard
        label="Dados de baja"
        value={String(dadosDeBaja)}
        helper={`De ${resguardos.length} registros capturados`}
        icon="baja"
        tone="danger"
        progress={toPercentage(dadosDeBaja, resguardos.length)}
        href={bajaHref}
        selected={activeEstado === "3"}
      />
    </section>
  );
}
