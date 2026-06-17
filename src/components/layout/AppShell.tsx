import type { ReactNode } from "react";

import SidebarNav from "@/components/layout/SidebarNav";
import MotionItem from "@/components/ui/MotionItem";
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
        <MotionItem className={styles.brandBlock} variant="fade-up">
          <span className={styles.eyebrow}>Sistema</span>
          <h1 className={styles.brandTitle}>Resguardo de Computo</h1>
          <p className={styles.brandText}>Control administrativo.</p>
        </MotionItem>

        <SidebarNav navigation={navigation} />
      </aside>

      <div className={styles.mainColumn}>
        <MotionItem as="header" className={styles.topbar} variant="fade">
          <div>
            <p className={styles.topbarKicker}>Gestion interna</p>
            <p className={styles.topbarTitle}>Panel administrativo</p>
          </div>
        </MotionItem>

        <MotionItem as="main" className={styles.content} delay={0.08}>
          {children}
        </MotionItem>
      </div>
    </div>
  );
}
