import type { ReactNode } from "react";

import SidebarNav from "@/components/layout/SidebarNav";
import styles from "@/components/layout/AppShell.module.css";

export interface NavigationItem {
  href: string;
  label: string;
  description?: string;
}

interface AppShellProps {
  navigation: NavigationItem[];
  children: ReactNode;
}

export default function AppShell({ navigation, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <span className={styles.eyebrow}>Sistema</span>
          <h1 className={styles.brandTitle}>Resguardo de Computo</h1>
          <p className={styles.brandText}>Control administrativo.</p>
        </div>

        <SidebarNav navigation={navigation} />
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.topbarKicker}>Gestion interna</p>
            <p className={styles.topbarTitle}>Panel administrativo</p>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
