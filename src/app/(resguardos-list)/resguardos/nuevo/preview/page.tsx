import ResguardoPreview from "@/features/resguardos/ResguardoPreview";
import ResguardoPreviewActions from "@/features/resguardos/ResguardoPreviewActions";
import { requireSession } from "@/lib/auth/session";
import styles from "@/app/(resguardos-list)/resguardos/nuevo/page.module.css";

export default async function PreviewResguardoPage() {
  const session = await requireSession();

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

      <ResguardoPreview usuarioModifica={session.username} />
    </section>
  );
}
