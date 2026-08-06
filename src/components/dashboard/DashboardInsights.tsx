"use client";

import { useMemo, useState } from "react";

import ActivityChart from "@/components/charts/ActivityChart";
import RankingBars from "@/components/charts/RankingBars";
import Panel from "@/components/ui/Panel";
import type { Resguardo } from "@/lib/types/api";
import {
  buildActivitySeries,
  filterByAdscripcion,
  filterBySeriesMetric,
  rankBy,
  SERIES_METRIC_LABELS,
  type SeriesMetric,
} from "@/lib/utils/dashboard";
import styles from "@/components/dashboard/DashboardInsights.module.css";

interface DashboardInsightsProps {
  resguardos: Resguardo[];
}

const RANK_LIMIT = 7;

export default function DashboardInsights({
  resguardos,
}: DashboardInsightsProps) {
  const [selectedAdscripcion, setSelectedAdscripcion] = useState<string | null>(
    null,
  );
  const [selectedMetric, setSelectedMetric] = useState<SeriesMetric | null>(
    null,
  );

  const chartResguardos = useMemo(
    () => filterByAdscripcion(resguardos, selectedAdscripcion),
    [resguardos, selectedAdscripcion],
  );

  const rankingResguardos = useMemo(
    () => filterBySeriesMetric(resguardos, selectedMetric),
    [resguardos, selectedMetric],
  );

  const series = useMemo(
    () => buildActivitySeries(chartResguardos),
    [chartResguardos],
  );

  const adscripciones = useMemo(
    () => rankBy(rankingResguardos, undefined, RANK_LIMIT),
    [rankingResguardos],
  );

  function toggleAdscripcion(label: string) {
    setSelectedAdscripcion((current) => (current === label ? null : label));
  }

  function toggleMetric(metric: SeriesMetric) {
    setSelectedMetric((current) => (current === metric ? null : metric));
  }

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        <Panel
          title="Movimientos de resguardos"
          description={
            selectedAdscripcion
              ? (
                  <>
                    Solo movimientos de{" "}
                    <strong className={styles.selectedAdscripcion}>
                      {selectedAdscripcion}
                    </strong>
                    .
                  </>
                )
              : "Altas, modificaciones y bajas registradas en el periodo seleccionado. Haz clic en una serie para filtrar adscripciones."
          }
        >
          <ActivityChart
            series={series}
            selectedMetric={selectedMetric}
            onMetricSelect={toggleMetric}
            emptyMessage={
              selectedAdscripcion
                ? "No hay movimientos para esta adscripción en el periodo."
                : "Aún no hay movimientos registrados en este periodo."
            }
          />
        </Panel>

        <Panel
          title="Adscripciones"
          description={
            selectedMetric
              ? `Áreas con ${SERIES_METRIC_LABELS[selectedMetric].toLocaleLowerCase("es-MX")}.`
              : "Áreas con más resguardos asignados. Haz clic en un área para filtrar la gráfica."
          }
        >
          <RankingBars
            items={adscripciones}
            selectedLabel={selectedAdscripcion}
            onSelect={toggleAdscripcion}
            tone={
              selectedMetric === "eliminados"
                ? "tertiary"
                : selectedMetric === "modificados"
                  ? "neutral"
                  : "secondary"
            }
            total={rankingResguardos.length}
            unit="resguardos"
            emptyMessage={
              selectedMetric
                ? "No hay adscripciones para esta serie."
                : "Sin información de adscripciones."
            }
          />
        </Panel>
      </div>
    </section>
  );
}
