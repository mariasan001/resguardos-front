import type { ReactNode } from "react";

import styles from "@/app/(resguardos-list)/resguardos/layout.module.css";

export default function ResguardosLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.kicker}>Gestion interna</p>
          <p className={styles.title}>Modulo de resguardos</p>
        </div>
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
