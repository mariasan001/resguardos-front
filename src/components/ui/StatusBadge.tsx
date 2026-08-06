import { getEstadoLabel } from "@/lib/utils/format";

import styles from "@/components/ui/StatusBadge.module.css";

interface StatusBadgeProps {
  value?: number;
}

const TONES: Record<number, string> = {
  1: styles.active,
  2: styles.returned,
  3: styles.cancelled,
};

export default function StatusBadge({ value }: StatusBadgeProps) {
  const label = getEstadoLabel(value);
  const tone = (value !== undefined && TONES[value]) || styles.neutral;

  return (
    <span className={`${styles.badge} ${tone}`}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </span>
  );
}
