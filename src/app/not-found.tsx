import Link from "next/link";

import styles from "@/app/not-found.module.css";
import { AUTH_ROUTES, getHomeRoute } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";

export default async function NotFound() {
  const session = await getSession();
  const homeHref = session
    ? getHomeRoute(session.role)
    : AUTH_ROUTES.login;
  const homeLabel = session
    ? "Volver al panel principal"
    : "Ir al inicio de sesión";

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>No encontramos la vista solicitada.</h1>
        <p className={styles.description}>
          La ruta no existe o el recurso aún no está disponible dentro del
          sistema.
        </p>
        <Link href={homeHref} className={styles.link}>
          {homeLabel}
        </Link>
      </div>
    </main>
  );
}
