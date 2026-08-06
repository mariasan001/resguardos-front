"use client";

import { DoorOpen, SquarePen } from "lucide-react";
import Link from "next/link";

import styles from "@/features/resguardos/ResguardoRecordActions.module.css";

interface ResguardoRecordActionsProps {
  editHref?: string;
  exitHref?: string;
}

export default function ResguardoRecordActions({
  editHref,
  exitHref,
}: ResguardoRecordActionsProps) {
  return (
    <div className={styles.actions}>
      {editHref ? (
        <Link href={editHref} className={styles.primaryAction}>
          <SquarePen size={16} strokeWidth={1.9} />
          Editar
        </Link>
      ) : null}
      {exitHref ? (
        <Link href={exitHref} className={styles.secondaryAction}>
          <DoorOpen size={16} strokeWidth={1.9} />
          Salir
        </Link>
      ) : null}
    </div>
  );
}
