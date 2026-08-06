import Link from "next/link";
import {
  Archive,
  BookOpen,
  FileSignature,
  FileText,
  LucideIcon,
  Mail,
  ShieldCheck,
  SquarePen,
  UserCheck,
  Users,
} from "lucide-react";

import MotionItem from "@/components/ui/MotionItem";
import styles from "@/components/ui/StatCard.module.css";

type StatCardIcon =
  | "resguardos"
  | "activos"
  | "usuarios"
  | "usuariosActivos"
  | "modificados"
  | "baja"
  | "firma"
  | "catalogos"
  | "correo";

export type StatCardTone = "brand" | "success" | "warning" | "danger";

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  icon?: StatCardIcon;
  tone?: StatCardTone;
  progress?: number;
  href?: string;
  selected?: boolean;
}

const iconMap: Record<StatCardIcon, LucideIcon> = {
  resguardos: FileText,
  activos: ShieldCheck,
  usuarios: Users,
  usuariosActivos: UserCheck,
  modificados: SquarePen,
  baja: Archive,
  firma: FileSignature,
  catalogos: BookOpen,
  correo: Mail,
};

export default function StatCard({
  label,
  value,
  helper,
  icon = "resguardos",
  tone = "brand",
  progress,
  href,
  selected = false,
}: StatCardProps) {
  const Icon = iconMap[icon];
  const share =
    progress === undefined
      ? undefined
      : Math.min(Math.max(Math.round(progress), 0), 100);

  const content = (
    <>
      <span className={styles.iconWrap} data-tone={tone} aria-hidden="true">
        <Icon size={17} strokeWidth={1.9} />
      </span>

      <div className={styles.body}>
        <span className={styles.label}>{label}</span>

        <div className={styles.valueRow}>
          <strong className={styles.value}>{value}</strong>
          {share !== undefined ? (
            <span className={styles.badge} data-tone={tone}>
              {share}%
            </span>
          ) : null}
        </div>

        {share !== undefined ? (
          <div className={styles.meter}>
            <div
              className={styles.meterFill}
              data-tone={tone}
              style={{ width: `${share}%` }}
            />
          </div>
        ) : null}

        <p className={styles.helper}>{helper}</p>
      </div>
    </>
  );

  return (
    <MotionItem as="article" className={styles.cardWrap} variant="scale">
      {href ? (
        <Link
          href={href}
          className={`${styles.card} ${styles.interactive}`}
          data-tone={tone}
          data-selected={selected ? "true" : undefined}
          aria-pressed={selected}
          scroll={false}
        >
          {content}
        </Link>
      ) : (
        <div className={styles.card}>{content}</div>
      )}
    </MotionItem>
  );
}
