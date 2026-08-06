import { LogOut } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import AppNavigation from "@/components/layout/AppNavigation";
import { logoutAction } from "@/features/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { SessionPayload } from "@/lib/auth/types";
import styles from "@/components/layout/AuthenticatedShell.module.css";

interface AuthenticatedShellProps {
  children: ReactNode;
  session: SessionPayload;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toLocaleUpperCase("es-MX");
}

export default function AuthenticatedShell({
  children,
  session,
}: AuthenticatedShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <Image
            src="/img/logos.png"
            alt="Gobierno del Estado de México"
            width={330}
            height={61}
            className={styles.logos}
            priority
          />
          <div className={styles.product}>
            <span>Gestión institucional</span>
            <strong>Resguardos de cómputo</strong>
          </div>
        </div>

        <div className={styles.session}>
          <div className={styles.avatar} aria-hidden="true">
            {getInitials(session.name)}
          </div>
          <div className={styles.userCopy}>
            <strong>{session.name}</strong>
            <span>{ROLE_LABELS[session.role]}</span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className={styles.logoutButton}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={18} strokeWidth={1.9} aria-hidden="true" />
            </button>
          </form>
        </div>
      </header>

      <div className={styles.navBar}>
        <AppNavigation role={session.role} />
      </div>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
