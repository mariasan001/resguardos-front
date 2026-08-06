"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import type { ChartTone } from "@/components/charts/types";
import type { CountItem } from "@/lib/utils/dashboard";
import { toPercentage } from "@/lib/utils/dashboard";
import styles from "@/components/charts/RankingBars.module.css";

type SortOrder = "desc" | "asc";

interface RankingBarsProps {
  items: CountItem[];
  emptyMessage: string;
  tone?: ChartTone;
  total?: number;
  unit?: string;
  selectedLabel?: string | null;
  onSelect?: (label: string) => void;
}

const MIN_VISIBLE_WIDTH = 4;
const STAGGER_MS = 70;

const SORT_OPTIONS: {
  id: SortOrder;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "desc", label: "Mayor a menor", icon: ArrowDownWideNarrow },
  { id: "asc", label: "Menor a mayor", icon: ArrowUpNarrowWide },
];

export default function RankingBars({
  items,
  emptyMessage,
  tone = "primary",
  total,
  unit = "registros",
  selectedLabel = null,
  onSelect,
}: RankingBarsProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const maxValue = items.reduce((max, item) => Math.max(max, item.value), 0);
  const visibleTotal = items.reduce((sum, item) => sum + item.value, 0);
  const reference = total ?? visibleTotal;

  const sortedItems = useMemo(() => {
    const next = [...items];

    next.sort((left, right) => {
      const byValue =
        sortOrder === "desc"
          ? right.value - left.value
          : left.value - right.value;

      return byValue || left.label.localeCompare(right.label, "es-MX");
    });

    return next;
  }, [items, sortOrder]);

  if (!items.length || maxValue === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <p className={styles.summary}>
          <strong>{visibleTotal}</strong>
          <span>
            de {reference} {unit} en el top {items.length}
          </span>
        </p>

        <div
          className={styles.switcher}
          role="group"
          aria-label="Orden de la lista"
        >
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                className={styles.switchButton}
                data-active={option.id === sortOrder}
                aria-pressed={option.id === sortOrder}
                aria-label={option.label}
                title={option.label}
                onClick={() => setSortOrder(option.id)}
              >
                <Icon size={15} strokeWidth={1.9} />
              </button>
            );
          })}
        </div>
      </div>

      <ol className={styles.list} key={sortOrder}>
        {sortedItems.map((item, index) => {
          const selected = selectedLabel === item.label;
          const dimmed = selectedLabel !== null && !selected;

          return (
            <li key={item.label}>
              <button
                type="button"
                className={styles.item}
                data-selected={selected}
                data-dimmed={dimmed}
                aria-pressed={selected}
                title={
                  selected
                    ? "Quitar filtro de esta adscripción"
                    : "Filtrar la gráfica por esta adscripción"
                }
                style={{ "--delay": `${index * STAGGER_MS}ms` } as CSSProperties}
                onClick={() => onSelect?.(item.label)}
              >
                <span
                  className={styles.rank}
                  data-leader={
                    sortOrder === "desc"
                      ? index === 0
                      : index === sortedItems.length - 1
                  }
                >
                  {index + 1}
                </span>

                <div className={styles.content}>
                  <div className={styles.top}>
                    <span className={styles.label} title={item.label}>
                      {item.label}
                    </span>
                    <span className={styles.value}>
                      {item.value}
                      <small>{toPercentage(item.value, reference)}%</small>
                    </span>
                  </div>

                  <div className={styles.track}>
                    <div
                      className={`${styles.bar} ${styles[tone]}`}
                      style={{
                        width: `${Math.max((item.value / maxValue) * 100, MIN_VISIBLE_WIDTH)}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
