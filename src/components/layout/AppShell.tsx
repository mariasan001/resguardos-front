import type { ReactNode } from "react";

import MotionItem from "@/components/ui/MotionItem";
import styles from "@/components/layout/AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
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
