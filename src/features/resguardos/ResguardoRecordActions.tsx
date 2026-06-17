"use client";

import { DoorOpen, PencilLine, Printer } from "lucide-react";
import Link from "next/link";

import styles from "@/features/resguardos/ResguardoRecordActions.module.css";

interface ResguardoRecordActionsProps {
  editHref?: string;
  exitHref?: string;
}

export default function ResguardoRecordActions({
  editHref = "/resguardos/nuevo",
  exitHref = "/resguardos",
}: ResguardoRecordActionsProps) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.primaryAction}
        onClick={() => window.print()}
      >
        <Printer size={16} strokeWidth={1.9} />
        Imprimir
      </button>

      <Link href={editHref} className={styles.secondaryAction}>
        <PencilLine size={16} strokeWidth={1.9} />
        Editar
      </Link>

      <Link href={exitHref} className={styles.secondaryAction}>
        <DoorOpen size={16} strokeWidth={1.9} />
        Salir
      </Link>
    </div>
  );
}
