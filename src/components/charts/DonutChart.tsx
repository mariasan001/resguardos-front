import { CHART_TONE_SEQUENCE } from "@/components/charts/types";
import type { CountItem } from "@/lib/utils/dashboard";
import { toPercentage } from "@/lib/utils/dashboard";
import styles from "@/components/charts/DonutChart.module.css";

interface DonutChartProps {
  items: CountItem[];
  centerLabel: string;
  emptyMessage: string;
}

const SIZE = 148;
const STROKE = 20;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DonutChart({
  items,
  centerLabel,
  emptyMessage,
}: DonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  const segments = items.reduce<
    { label: string; tone: string; length: number; offset: number }[]
  >((accumulated, item, index) => {
    if (!item.value) {
      return accumulated;
    }

    const previous = accumulated.at(-1);

    return [
      ...accumulated,
      {
        label: item.label,
        tone: CHART_TONE_SEQUENCE[index % CHART_TONE_SEQUENCE.length],
        length: (item.value / total) * CIRCUMFERENCE,
        offset: previous ? previous.offset + previous.length : 0,
      },
    ];
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartWrap}>
        <svg
          className={styles.chart}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={items
            .map((item) => `${item.label}: ${item.value}`)
            .join(", ")}
        >
          <circle
            className={styles.track}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE}
          />
          {segments.map((segment) => (
            <circle
              key={segment.label}
              className={`${styles.segment} ${styles[segment.tone]}`}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={-segment.offset}
            />
          ))}
        </svg>

        <div className={styles.center}>
          <strong>{total}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <ul className={styles.legend}>
        {items.map((item, index) => (
          <li key={item.label} className={styles.legendItem}>
            <span
              className={`${styles.dot} ${
                styles[CHART_TONE_SEQUENCE[index % CHART_TONE_SEQUENCE.length]]
              }`}
              aria-hidden="true"
            />
            <span className={styles.legendLabel}>{item.label}</span>
            <span className={styles.legendValue}>
              {item.value}
              <small>{toPercentage(item.value, total)}%</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
