"use client";

import Link from "next/link";
import { Download, Eye, RotateCcw } from "lucide-react";
import { useEffect, useMemo } from "react";

import styles from "@/features/resguardos/ResguardoReceiptCard.module.css";

interface ResguardoReceiptCardProps {
  createdResguardoId: number;
  filename: string;
  pdfFile: File;
}

export default function ResguardoReceiptCard({
  createdResguardoId,
  filename,
  pdfFile,
}: ResguardoReceiptCardProps) {
  const downloadUrl = useMemo(
    () => URL.createObjectURL(pdfFile),
    [pdfFile],
  );

  useEffect(() => {
    return () => URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Vista previa del PDF</h2>
          <p className={styles.description}>
            El resguardo fue registrado. Revisa como quedara el documento antes de
            continuar con el envio por correo.
          </p>
        </div>

        <span className={styles.badge}>Resguardo {createdResguardoId}</span>
      </div>

      <div className={styles.previewFrame}>
        <div className={styles.previewToolbar}>
          <span className={styles.previewLabel}>
            <Eye size={15} strokeWidth={1.9} />
            Documento generado
          </span>
          <span className={styles.previewFilename}>{filename}</span>
        </div>

        <iframe
          className={styles.previewViewport}
          src={downloadUrl}
          title="Vista previa del PDF del resguardo"
        />
      </div>

      <div className={styles.actions}>
        <a href={downloadUrl} download={filename} className={styles.secondaryButton}>
          <Download size={16} strokeWidth={1.9} />
          Descargar PDF
        </a>

        <Link href="/resguardos" className={styles.secondaryButton}>
          <RotateCcw size={16} strokeWidth={1.9} />
          Volver a resguardos
        </Link>
      </div>
    </section>
  );
}
