import { getEstadoLabel } from "@/lib/utils/format";

import styles from "@/components/ui/StatusBadge.module.css";

interface StatusBadgeProps {
  value?: number;
}

export default function StatusBadge({ value }: StatusBadgeProps) {
  const label = getEstadoLabel(value);
  const className =
    value === 1
      ? styles.active
      : value === 2
        ? styles.returned
        : styles.neutral;

  return <span className={`${styles.badge} ${className}`}>{label}</span>;
}
