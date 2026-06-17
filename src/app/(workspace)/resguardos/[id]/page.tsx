import ResguardoDetailVerification from "@/features/resguardos/ResguardoDetailVerification";
import ResguardoRecordActions from "@/features/resguardos/ResguardoRecordActions";
import ResguardoSummary from "@/features/resguardos/ResguardoSummary";
import { getResguardoById } from "@/lib/services/resguardos.service";
import { formatText } from "@/lib/utils/format";
import { buildResguardoSummarySections } from "@/lib/utils/resguardo-summary";
import styles from "@/app/(resguardos-list)/resguardos/nuevo/page.module.css";

interface ResguardoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResguardoDetailPage({
  params,
}: ResguardoDetailPageProps) {
  const { id } = await params;
  const resguardo = await getResguardoById(Number(id));

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Previsualizacion del resguardo</h1>
          <p className={styles.description}>
            Revisa la informacion registrada y la firma asociada al resguardo.
          </p>
        </div>

        <ResguardoRecordActions
          editHref="/resguardos/nuevo"
          exitHref="/resguardos"
        />
      </div>

      <ResguardoSummary
        sections={buildResguardoSummarySections(resguardo)}
        footer={
          <ResguardoDetailVerification
            resguardoId={Number(resguardo.id ?? id)}
            titular={formatText(resguardo.usuarioTitular?.nombre, "Titular asignado")}
            titularEmail={resguardo.usuarioTitular?.email ?? ""}
          />
        }
      />
    </section>
  );
}
