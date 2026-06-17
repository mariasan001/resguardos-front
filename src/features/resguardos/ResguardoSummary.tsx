import type { ReactNode } from "react";

import styles from "@/features/resguardos/ResguardoPreview.module.css";

export interface ResguardoSummaryItem {
  label: string;
  value: string;
  secondary?: string;
}

export interface ResguardoSummarySection {
  title: string;
  icon: ReactNode;
  items: ResguardoSummaryItem[];
  columns?: 1 | 2;
}

interface ResguardoSummaryProps {
  sections: ResguardoSummarySection[];
  footer?: ReactNode;
}

function SummarySection({
  title,
  icon,
  items,
  columns = 2,
}: ResguardoSummarySection) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>

      <dl
        className={`${styles.definitionList} ${
          columns === 2 ? styles.definitionListTwoColumns : styles.definitionListOneColumn
        }`}
      >
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className={styles.definitionRow}>
            <dt className={styles.definitionTerm}>{item.label}</dt>
            <dd className={styles.definitionValue}>
              <span>{item.value}</span>
              {item.secondary ? <small>{item.secondary}</small> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ResguardoSummary({
  sections,
  footer,
}: ResguardoSummaryProps) {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.recordCard}>
            <div className={styles.sections}>
              {sections.map((section) => (
                <SummarySection key={section.title} {...section} />
              ))}
            </div>
          </section>

          {footer}
        </div>
      </div>
    </div>
  );
}
