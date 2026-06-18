import { FileText, LucideIcon, ShieldCheck, Users } from "lucide-react";

import MotionItem from "@/components/ui/MotionItem";
import styles from "@/components/ui/StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  icon?: "resguardos" | "activos" | "usuarios";
  compact?: boolean;
}

const iconMap: Record<NonNullable<StatCardProps["icon"]>, LucideIcon> = {
  resguardos: FileText,
  activos: ShieldCheck,
  usuarios: Users,
};

export default function StatCard({
  label,
  value,
  helper,
  icon,
  compact = false,
}: StatCardProps) {
  const Icon = icon ? iconMap[icon] : FileText;

  return (
    <MotionItem
      as="article"
      className={`${styles.card} ${compact ? styles.cardCompact : ""}`}
      variant="scale"
    >
      <div className={styles.top}>
        <span className={`${styles.label} ${compact ? styles.labelCompact : ""}`}>{label}</span>
        <span className={`${styles.iconWrap} ${compact ? styles.iconWrapCompact : ""}`}>
          <Icon size={18} strokeWidth={1.9} />
        </span>
      </div>
      <strong className={`${styles.value} ${compact ? styles.valueCompact : ""}`}>{value}</strong>
      <p className={`${styles.helper} ${compact ? styles.helperCompact : ""}`}>{helper}</p>
    </MotionItem>
  );
}
