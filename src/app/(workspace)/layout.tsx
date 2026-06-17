import type { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/utils/routes";

const navigation = [
  {
    href: ROUTES.dashboard,
    label: "Dashboard",
    description: "Resumen general",
  },
  {
    href: ROUTES.resguardos,
    label: "Resguardos",
    description: "Consulta y alta",
  },
  {
    href: ROUTES.usuarios,
    label: "Usuarios",
    description: "Directorio",
  },
  {
    href: ROUTES.catalogos,
    label: "Catalogos",
    description: "Listas maestras",
  },
];

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AppShell navigation={navigation}>{children}</AppShell>;
}
