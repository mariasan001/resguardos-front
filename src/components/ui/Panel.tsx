import type { ReactNode } from "react";

import styles from "@/components/ui/Panel.module.css";

interface PanelProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export default function Panel({ title, description, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      {title || description ? (
        <header className={styles.header}>
          {title ? <h3 className={styles.title}>{title}</h3> : null}
          {description ? <p className={styles.description}>{description}</p> : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}
