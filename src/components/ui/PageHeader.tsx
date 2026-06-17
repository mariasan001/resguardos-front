import { ArrowRight } from "lucide-react";
import Link from "next/link";

import styles from "@/components/ui/PageHeader.module.css";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: PageHeaderProps) {
  return (
    <section className={styles.header}>
      <div className={styles.copy}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>

      {actionHref && actionLabel ? (
        <Link href={actionHref} className={styles.action}>
          {actionLabel}
          <ArrowRight size={16} strokeWidth={2} />
        </Link>
      ) : null}
    </section>
  );
}
