import Link from "next/link";

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
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">No encontramos la vista solicitada.</h1>
        <p className="not-found-description">
          La ruta no existe o el recurso aún no está disponible dentro del
          sistema.
        </p>
        <Link href={homeHref} className="not-found-link">
          {homeLabel}
        </Link>
      </div>
    </main>
  );
}
