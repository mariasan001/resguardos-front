import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import EmptyState from "@/components/ui/EmptyState";
import styles from "@/components/ui/DataTable.module.css";

export type SortDirection = "asc" | "desc";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  filter?: ReactNode;
}

interface SortConfig {
  key: string;
  direction: SortDirection;
  buildHref: (key: string, direction: SortDirection) => string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyTitle: string;
  emptyDescription: string;
  emptyContent?: ReactNode;
  sort?: SortConfig;
  embedded?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  emptyContent,
  sort,
  embedded = false,
}: DataTableProps<T>) {
  const hasFilters = columns.some((column) => column.filter);
  const showEmptyInsideTable = !data.length && hasFilters;

  if (!data.length && !hasFilters) {
    if (emptyContent) {
      return emptyContent;
    }
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={`${styles.wrapper} ${embedded ? styles.embedded : ""}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = sort?.key === column.key;
              const nextDirection: SortDirection =
                isSorted && sort?.direction === "asc" ? "desc" : "asc";
              const SortIcon = !isSorted
                ? ChevronsUpDown
                : sort?.direction === "asc"
                  ? ArrowUp
                  : ArrowDown;

              return (
                <th
                  key={column.key}
                  className={column.headerClassName}
                  data-column={column.key}
                  data-align={column.align}
                  aria-sort={
                    isSorted
                      ? sort?.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <div className={styles.headerContent}>
                    {column.sortable && sort ? (
                      <Link
                        href={sort.buildHref(column.key, nextDirection)}
                        className={styles.sortLink}
                        data-active={isSorted}
                        scroll={false}
                      >
                        {column.header}
                        <SortIcon size={13} strokeWidth={2} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className={styles.headerLabel}>{column.header}</span>
                    )}
                    {column.filter}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {showEmptyInsideTable ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                {emptyContent ?? (
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                )}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.cellClassName}
                    data-column={column.key}
                    data-align={column.align}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
