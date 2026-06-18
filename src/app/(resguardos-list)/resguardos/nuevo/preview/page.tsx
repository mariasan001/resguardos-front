import ResguardoPreview from "@/features/resguardos/ResguardoPreview";
import ResguardoRecordActions from "@/features/resguardos/ResguardoRecordActions";
import styles from "@/app/(resguardos-list)/resguardos/nuevo/page.module.css";

export default function PreviewResguardoPage() {
  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Previsualizacion del resguardo</h1>
          <p className={styles.description}>
            Revisa la informacion capturada antes de continuar con la firma.
          </p>
        </div>

        <ResguardoRecordActions
          editHref="/resguardos/nuevo?continue=1"
          exitHref="/resguardos"
        />
      </div>

      <ResguardoPreview />
    </section>
  );
}
