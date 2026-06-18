import { ArrowRight } from "lucide-react";
import Link from "next/link";

import MotionItem from "@/components/ui/MotionItem";
import styles from "@/components/ui/PageHeader.module.css";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  compact = false,
}: PageHeaderProps) {
  return (
    <MotionItem
      as="section"
      className={`${styles.header} ${compact ? styles.headerCompact : ""}`}
    >
      <div className={`${styles.copy} ${compact ? styles.copyCompact : ""}`}>
        {eyebrow ? (
          <span className={`${styles.eyebrow} ${compact ? styles.eyebrowCompact : ""}`}>
            {eyebrow}
          </span>
        ) : null}
        <h2 className={`${styles.title} ${compact ? styles.titleCompact : ""}`}>{title}</h2>
        <p className={`${styles.description} ${compact ? styles.descriptionCompact : ""}`}>
          {description}
        </p>
      </div>

      {actionHref && actionLabel ? (
        <Link href={actionHref} className={`${styles.action} ${compact ? styles.actionCompact : ""}`}>
          {actionLabel}
          <ArrowRight size={16} strokeWidth={2} />
        </Link>
      ) : null}
    </MotionItem>
  );
}
