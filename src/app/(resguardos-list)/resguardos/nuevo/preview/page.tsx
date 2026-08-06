import ResguardoPreview from "@/features/resguardos/ResguardoPreview";
import ResguardoPreviewActions from "@/features/resguardos/ResguardoPreviewActions";
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

        <ResguardoPreviewActions />
      </div>

      <ResguardoPreview />
    </section>
  );
}
