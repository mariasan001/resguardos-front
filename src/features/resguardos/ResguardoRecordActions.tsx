"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

import styles from "@/features/resguardos/ResguardoRecordActions.module.css";

interface ResguardoRecordActionsProps {
  backHref?: string;
}

export default function ResguardoRecordActions({
  backHref = "/resguardos",
}: ResguardoRecordActionsProps) {
  return (
    <div className={styles.actions}>
      <Link href={backHref} className={styles.secondaryAction}>
        <ArrowLeft size={16} strokeWidth={1.9} />
        Volver a resguardos
      </Link>

      <button
        type="button"
        className={styles.primaryAction}
        onClick={() => window.print()}
      >
        <Printer size={16} strokeWidth={1.9} />
        Imprimir formato
      </button>
    </div>
  );
}
