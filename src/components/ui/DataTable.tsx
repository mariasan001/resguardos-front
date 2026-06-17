import type { ReactNode } from "react";

import EmptyState from "@/components/ui/EmptyState";
import MotionList from "@/components/ui/MotionList";
import styles from "@/components/ui/DataTable.module.css";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyTitle: string;
  emptyDescription: string;
  emptyContent?: ReactNode;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  emptyContent,
}: DataTableProps<T>) {
  if (!data.length) {
    if (emptyContent) {
      return emptyContent;
    }
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <MotionList className={styles.wrapper} selector="tbody tr" stagger={0.045}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.headerClassName}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((column) => (
                <td key={column.key} className={column.cellClassName}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </MotionList>
  );
}
