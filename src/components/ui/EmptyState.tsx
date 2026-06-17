import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import styles from "@/components/ui/EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  actions,
}: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <span className={styles.iconWrap}>
        <Inbox size={16} strokeWidth={1.8} />
      </span>
      <div className={styles.copy}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
