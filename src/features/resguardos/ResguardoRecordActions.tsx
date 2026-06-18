"use client";

import { DoorOpen } from "lucide-react";
import Link from "next/link";

import styles from "@/features/resguardos/ResguardoRecordActions.module.css";

interface ResguardoRecordActionsProps {
  editHref?: string;
  exitHref?: string;
}

export default function ResguardoRecordActions({
  exitHref = "/resguardos",
}: ResguardoRecordActionsProps) {
  return (
    <div className={styles.actions}>
      <Link href={exitHref} className={styles.secondaryAction}>
        <DoorOpen size={16} strokeWidth={1.9} />
        Salir
      </Link>
    </div>
  );
}
