import ResguardoDetailVerification from "@/features/resguardos/ResguardoDetailVerification";
import ResguardoLogsCard from "@/features/resguardos/ResguardoLogsCard";
import ResguardoRecordActions from "@/features/resguardos/ResguardoRecordActions";
import ResguardoSummary from "@/features/resguardos/ResguardoSummary";
import { requireSession } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import { getAccesorios } from "@/lib/services/catalogos.service";
import {
  getResguardoByIdServer,
  getResguardoLogsServer,
} from "@/lib/services/resguardos.server";
import type { ResguardoLog } from "@/lib/types/api";
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
  const isAdmin = session.role === USER_ROLES.admin;
  const resguardoId = Number(id);

  const [resguardo, accesorios, logsResult] = await Promise.all([
    getResguardoByIdServer(resguardoId),
    getAccesorios().catch(() => []),
    isAdmin
      ? getResguardoLogsServer(resguardoId)
          .then((logs) => ({ logs, error: null as string | null }))
          .catch(() => ({
            logs: [] as ResguardoLog[],
            error: "No fue posible cargar la bitácora de este resguardo.",
          }))
      : Promise.resolve({ logs: [] as ResguardoLog[], error: null }),
  ]);

  const summary = buildResguardoSummary(
    completeResguardoAccesorios(resguardo, accesorios),
  );
  const resolvedId = Number(resguardo.id ?? id);
  const canEdit = isAdmin && Number.isInteger(resolvedId);

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
          editHref={canEdit ? `/resguardos/nuevo?edit=${resolvedId}` : undefined}
        />
      </div>

      <ResguardoSummary
        hero={summary.hero}
        sections={summary.sections}
        accessories={summary.accessories}
        footer={
          <>
            {isAdmin ? (
              <ResguardoLogsCard
                logs={logsResult.logs}
                errorMessage={logsResult.error}
              />
            ) : null}
            <ResguardoDetailVerification
              resguardoId={resolvedId}
              titular={formatText(
                resguardo.usuarioTitular?.nombre,
                "Titular asignado",
              )}
              titularEmail={resguardo.usuarioTitular?.email ?? ""}
            />
          </>
        }
      />
    </section>
  );
}
