import type { ReactNode } from "react";

import MotionItem from "@/components/ui/MotionItem";
import styles from "@/components/ui/Panel.module.css";

interface PanelProps {
  title?: string;
  description?: string;
  children: ReactNode;
  compact?: boolean;
}

export default function Panel({
  title,
  description,
  children,
  compact = false,
}: PanelProps) {
  return (
    <MotionItem
      as="section"
      className={`${styles.panel} ${compact ? styles.panelCompact : ""}`}
      variant="scale"
    >
      {title || description ? (
        <header className={`${styles.header} ${compact ? styles.headerCompact : ""}`}>
          {title ? (
            <h3 className={`${styles.title} ${compact ? styles.titleCompact : ""}`}>{title}</h3>
          ) : null}
          {description ? (
            <p className={`${styles.description} ${compact ? styles.descriptionCompact : ""}`}>
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      {children}
    </MotionItem>
  );
}
