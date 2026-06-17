import type { ReactNode } from "react";

import styles from "@/components/ui/DefinitionList.module.css";

interface Item {
  label: string;
  value: ReactNode;
}

interface DefinitionListProps {
  items: Item[];
}

export default function DefinitionList({ items }: DefinitionListProps) {
  return (
    <dl className={styles.list}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <dt className={styles.term}>{item.label}</dt>
          <dd className={styles.description}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
