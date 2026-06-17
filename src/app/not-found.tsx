import Link from "next/link";

import styles from "@/app/not-found.module.css";
import { ROUTES } from "@/lib/utils/routes";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>No encontramos la vista solicitada.</h1>
        <p className={styles.description}>
          La ruta no existe o el recurso aún no está disponible dentro del
          sistema.
        </p>
        <Link href={ROUTES.dashboard} className={styles.link}>
          Volver al panel principal
        </Link>
      </div>
    </main>
  );
}
