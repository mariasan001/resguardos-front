"use client";

import { useMemo, useState } from "react";

import type {
  ActivitySeries,
  SeriesGranularity,
  SeriesMetric,
  SeriesPoint,
} from "@/lib/utils/dashboard";
import { SERIES_METRIC_LABELS } from "@/lib/utils/dashboard";
import styles from "@/components/charts/ActivityChart.module.css";

interface ActivityChartProps {
  series: ActivitySeries;
  emptyMessage: string;
  selectedMetric?: SeriesMetric | null;
  onMetricSelect?: (metric: SeriesMetric) => void;
}

interface Scale {
  x: (index: number) => number;
  y: (value: number) => number;
}

const PERIODS: { id: SeriesGranularity; label: string }[] = [
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
];

const METRICS: { id: SeriesMetric; label: string }[] = [
  { id: "altas", label: SERIES_METRIC_LABELS.altas },
  { id: "modificados", label: SERIES_METRIC_LABELS.modificados },
  { id: "eliminados", label: SERIES_METRIC_LABELS.eliminados },
];

const WIDTH = 640;
const HEIGHT = 265;
const GRID_STEPS = 4;
const MAX_AXIS_LABELS = 9;

function getNiceMax(value: number) {
  return value <= GRID_STEPS
    ? GRID_STEPS
    : Math.ceil(value / GRID_STEPS) * GRID_STEPS;
}

/** Interpolación monótona: evita que la curva caiga por debajo de cero entre puntos. */
function buildSmoothPath(values: number[], scale: Scale) {
  if (!values.length) {
    return "";
  }

  const nodes = values.map((value, index) => ({
    x: scale.x(index),
    y: scale.y(value),
  }));

  if (nodes.length === 1) {
    return `M${nodes[0].x} ${nodes[0].y}`;
  }

  const deltas = nodes.slice(0, -1).map((node, index) => {
    const dx = nodes[index + 1].x - node.x;
    return { dx, slope: (nodes[index + 1].y - node.y) / dx };
  });

  const tangents = nodes.map((_, index) => {
    if (index === 0) {
      return deltas[0].slope;
    }

    if (index === nodes.length - 1) {
      return deltas[deltas.length - 1].slope;
    }

    const previous = deltas[index - 1].slope;
    const next = deltas[index].slope;

    return previous * next <= 0 ? 0 : (previous + next) / 2;
  });

  deltas.forEach((delta, index) => {
    if (delta.slope === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      return;
    }

    const start = tangents[index] / delta.slope;
    const end = tangents[index + 1] / delta.slope;
    const magnitude = Math.hypot(start, end);

    if (magnitude > 3) {
      tangents[index] = (3 * delta.slope * start) / magnitude;
      tangents[index + 1] = (3 * delta.slope * end) / magnitude;
    }
  });

  return nodes.reduce((path, node, index) => {
    if (index === 0) {
      return `M${node.x} ${node.y}`;
    }

    const previous = nodes[index - 1];
    const handle = deltas[index - 1].dx / 3;

    return `${path} C${previous.x + handle} ${previous.y + tangents[index - 1] * handle} ${node.x - handle} ${node.y - tangents[index] * handle} ${node.x} ${node.y}`;
  }, "");
}

function getTooltipTransform(index: number, total: number) {
  if (index === 0) {
    return "translateX(-12%)";
  }

  if (index === total - 1) {
    return "translateX(-88%)";
  }

  return "translateX(-50%)";
}

export default function ActivityChart({
  series,
  emptyMessage,
  selectedMetric = null,
  onMetricSelect,
}: ActivityChartProps) {
  const [granularity, setGranularity] = useState<SeriesGranularity>("mes");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = series[granularity];
  const visibleMetrics = selectedMetric
    ? METRICS.filter((metric) => metric.id === selectedMetric)
    : METRICS;

  const totals = useMemo(
    () =>
      METRICS.map((metric) => ({
        ...metric,
        total: points.reduce((sum, point) => sum + point[metric.id], 0),
      })),
    [points],
  );

  const maxValue = points.reduce(
    (max, point) =>
      Math.max(
        max,
        ...visibleMetrics.map((metric) => point[metric.id] as number),
      ),
    0,
  );
  const niceMax = getNiceMax(maxValue);
  const ticks = Array.from({ length: GRID_STEPS + 1 }, (_, index) =>
    Math.round((niceMax / GRID_STEPS) * (GRID_STEPS - index)),
  );

  const columnWidth = WIDTH / Math.max(points.length, 1);
  const scale: Scale = {
    x: (index) => columnWidth * (index + 0.5),
    y: (value) => HEIGHT - (value / niceMax) * HEIGHT,
  };

  const isolated = Boolean(selectedMetric);
  const labelStep = Math.ceil(points.length / MAX_AXIS_LABELS);
  /** Cambiar la clave remonta los trazos y vuelve a lanzar la animacion de dibujo. */
  const shapeKey = `${granularity}-${niceMax}-${selectedMetric ?? "all"}`;
  const activePoint: SeriesPoint | null =
    hoveredIndex === null ? null : (points[hoveredIndex] ?? null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <ul className={styles.legend}>
          {totals.map((metric) => {
            const dimmed =
              selectedMetric !== null && selectedMetric !== metric.id;

            return (
              <li key={metric.id}>
                <button
                  type="button"
                  className={styles.legendButton}
                  data-metric={metric.id}
                  data-hidden={dimmed}
                  data-selected={selectedMetric === metric.id}
                  aria-pressed={selectedMetric === metric.id}
                  title={
                    selectedMetric === metric.id
                      ? "Quitar filtro de esta serie"
                      : "Filtrar adscripciones por esta serie"
                  }
                  onClick={() => onMetricSelect?.(metric.id)}
                >
                  <span
                    className={styles.legendDot}
                    data-metric={metric.id}
                    aria-hidden="true"
                  />
                  <span className={styles.legendLabel}>{metric.label}</span>
                  <strong className={styles.legendValue}>{metric.total}</strong>
                </button>
              </li>
            );
          })}
        </ul>

        <div
          className={styles.switcher}
          role="group"
          aria-label="Periodo de la gráfica"
        >
          {PERIODS.map((period) => (
            <button
              key={period.id}
              type="button"
              className={styles.switchButton}
              data-active={period.id === granularity}
              aria-pressed={period.id === granularity}
              onClick={() => {
                setGranularity(period.id);
                setHoveredIndex(null);
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {maxValue === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <div className={styles.chart}>
          <div key={`y-${granularity}`} className={styles.yAxis} aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>

          <div className={styles.plot}>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="img"
              aria-label={totals
                .map((metric) => `${metric.label}: ${metric.total}`)
                .join(", ")}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {ticks.map((tick) => (
                <line
                  key={tick}
                  className={styles.gridLine}
                  x1={0}
                  x2={WIDTH}
                  y1={scale.y(tick)}
                  y2={scale.y(tick)}
                />
              ))}

              {hoveredIndex !== null ? (
                <line
                  className={styles.crosshair}
                  x1={scale.x(hoveredIndex)}
                  x2={scale.x(hoveredIndex)}
                  y1={0}
                  y2={HEIGHT}
                />
              ) : null}

              {isolated
                ? visibleMetrics.map((metric) => {
                    const values = points.map(
                      (point) => point[metric.id] as number,
                    );
                    const line = buildSmoothPath(values, scale);

                    return (
                      <path
                        key={`area-${shapeKey}-${metric.id}`}
                        className={styles.area}
                        data-metric={metric.id}
                        d={`${line} L${scale.x(points.length - 1)} ${HEIGHT} L${scale.x(0)} ${HEIGHT} Z`}
                      />
                    );
                  })
                : null}

              {METRICS.map((metric) => (
                <path
                  key={`${shapeKey}-${metric.id}`}
                  className={styles.line}
                  data-metric={metric.id}
                  data-hidden={
                    selectedMetric !== null && selectedMetric !== metric.id
                  }
                  pathLength={1}
                  d={buildSmoothPath(
                    points.map((point) => point[metric.id] as number),
                    scale,
                  )}
                />
              ))}

              {hoveredIndex !== null
                ? visibleMetrics.map((metric) => (
                    <circle
                      key={`dot-${metric.id}`}
                      className={styles.dot}
                      data-metric={metric.id}
                      cx={scale.x(hoveredIndex)}
                      cy={scale.y(points[hoveredIndex][metric.id] as number)}
                      r={4.5}
                    />
                  ))
                : null}

              {points.map((point, index) => (
                <rect
                  key={point.key}
                  className={styles.hoverArea}
                  x={columnWidth * index}
                  y={0}
                  width={columnWidth}
                  height={HEIGHT}
                  onMouseEnter={() => setHoveredIndex(index)}
                />
              ))}
            </svg>

            {activePoint && hoveredIndex !== null ? (
              <div
                className={styles.tooltip}
                style={{
                  left: `${((hoveredIndex + 0.5) / points.length) * 100}%`,
                  transform: getTooltipTransform(hoveredIndex, points.length),
                }}
              >
                <p className={styles.tooltipTitle}>{activePoint.fullLabel}</p>
                <ul className={styles.tooltipList}>
                  {visibleMetrics.map((metric) => (
                    <li key={metric.id}>
                      <span
                        className={styles.legendDot}
                        data-metric={metric.id}
                        aria-hidden="true"
                      />
                      <span>{metric.label}</span>
                      <strong>{activePoint[metric.id]}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <ul key={`x-${granularity}`} className={styles.xAxis} aria-hidden="true">
            {points.map((point, index) => (
              <li key={point.key} data-active={index === hoveredIndex}>
                {(points.length - 1 - index) % labelStep === 0
                  ? point.label
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
