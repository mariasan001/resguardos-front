import type { ReactNode } from "react";

import MotionItem from "@/components/ui/MotionItem";
import styles from "@/components/ui/Panel.module.css";

interface PanelProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export default function Panel({ title, description, children }: PanelProps) {
  return (
    <MotionItem as="section" className={styles.panel} variant="scale">
      {title || description ? (
        <header className={styles.header}>
          {title ? <h3 className={styles.title}>{title}</h3> : null}
          {description ? <p className={styles.description}>{description}</p> : null}
        </header>
      ) : null}

      {children}
    </MotionItem>
  );
}
