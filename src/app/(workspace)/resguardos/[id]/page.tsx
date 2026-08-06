import ResguardoDetailVerification from "@/features/resguardos/ResguardoDetailVerification";
import ResguardoRecordActions from "@/features/resguardos/ResguardoRecordActions";
import ResguardoSummary from "@/features/resguardos/ResguardoSummary";
import { requireSession } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import { getAccesorios } from "@/lib/services/catalogos.service";
import { getResguardoByIdServer } from "@/lib/services/resguardos.server";
import { formatText } from "@/lib/utils/format";
import { completeResguardoAccesorios } from "@/lib/utils/resguardo-accesorios";
import { buildResguardoSummary } from "@/lib/utils/resguardo-summary";
import styles from "@/app/(resguardos-list)/resguardos/nuevo/page.module.css";

interface ResguardoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResguardoDetailPage({
  params,
}: ResguardoDetailPageProps) {
  const { id } = await params;
  const session = await requireSession();
  const [resguardo, accesorios] = await Promise.all([
    getResguardoByIdServer(Number(id)),
    getAccesorios().catch(() => []),
  ]);
  const summary = buildResguardoSummary(
    completeResguardoAccesorios(resguardo, accesorios),
  );
  const resguardoId = Number(resguardo.id ?? id);
  const canEdit = session.role === USER_ROLES.admin && Number.isInteger(resguardoId);

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Detalle del resguardo</h1>
          <p className={styles.description}>
            Revisa la informacion registrada y la firma asociada al resguardo.
          </p>
        </div>

        <ResguardoRecordActions
          editHref={canEdit ? `/resguardos/nuevo?edit=${resguardoId}` : undefined}
        />
      </div>

      <ResguardoSummary
        hero={summary.hero}
        sections={summary.sections}
        accessories={summary.accessories}
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
