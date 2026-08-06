import DashboardInsights from "@/components/dashboard/DashboardInsights";
import LiveData from "@/components/dashboard/LiveData";
import StatsOverview from "@/components/dashboard/StatsOverview";
import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import { getResguardos } from "@/lib/services/resguardos.server";
import { getUsuarios } from "@/lib/services/usuarios.server";
import styles from "@/app/(workspace)/page.module.css";

export default async function HomePage() {
  await requireRole([USER_ROLES.admin]);
  const [resguardosResult, usuariosResult] = await Promise.allSettled([
    getResguardos(),
    getUsuarios(),
  ]);

  const resguardos =
    resguardosResult.status === "fulfilled" ? resguardosResult.value : [];
  const usuarios =
    usuariosResult.status === "fulfilled" ? usuariosResult.value : [];

  const hasFailures = [resguardosResult, usuariosResult].some(
    (result) => result.status === "rejected",
  );

  return (
    <>
      {hasFailures ? (
        <p className={styles.alert} role="alert">
          Algunos datos no pudieron cargarse desde el backend. Las secciones
          afectadas se muestran vacías.
        </p>
      ) : null}

      <LiveData />

      <StatsOverview resguardos={resguardos} usuariosCount={usuarios.length} />

      <DashboardInsights resguardos={resguardos} />
    </>
  );
}
