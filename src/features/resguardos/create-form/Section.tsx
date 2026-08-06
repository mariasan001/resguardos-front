"use client";

import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import type { SectionKey, SectionStatus } from "./types";

export function Section({
  icon,
  title,
  description,
  sectionKey,
  openKey,
  onToggle,
  status,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  sectionKey: SectionKey;
  openKey: SectionKey;
  onToggle: (section: SectionKey) => void;
  status: SectionStatus;
  children: ReactNode;
}) {
  const isOpen = openKey === sectionKey;
  const isComplete = status.total > 0 && status.completed === status.total;

  return (
    <section
      data-motion-item
      className={`${styles.section} ${isOpen ? styles.sectionOpen : ""} ${
        isComplete ? styles.sectionComplete : ""
      }`}
    >
      <button
        type="button"
        className={styles.sectionSummary}
        onClick={() => onToggle(sectionKey)}
        aria-expanded={isOpen}
      >
        <div className={styles.sectionMeta}>
          <span className={styles.sectionIcon}>{icon}</span>
          <div className={styles.sectionCopy}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <p className={styles.sectionText}>{description}</p>
          </div>
        </div>
        <div className={styles.sectionTools}>
          <span className={isComplete ? styles.completeBadge : styles.countBadge}>
            {isComplete ? (
              <>
                <Check size={12} strokeWidth={2.2} />
                Completo
              </>
            ) : (
              `${status.completed}/${status.total} campos`
            )}
          </span>
          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
            <ChevronDown size={16} strokeWidth={1.9} />
          </span>
        </div>
      </button>

      {isOpen ? <div className={styles.sectionBody}>{children}</div> : null}
    </section>
  );
}
