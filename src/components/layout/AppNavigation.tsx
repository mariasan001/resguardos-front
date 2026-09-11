"use client";

import {
  Archive,
  BookOpen,
  FilePlus2,
  Files,
  LayoutDashboard,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { USER_ROLES, type UserRole } from "@/lib/auth/types";
import styles from "@/components/layout/AuthenticatedShell.module.css";

interface AppNavigationProps {
  role: UserRole;
}

const ADMIN_ITEMS = [
  {
    href: "/",
    label: "Inicio",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/resguardos",
    label: "Resguardos",
    icon: Files,
    exact: true,
  },
  {
    href: "/bajas",
    label: "Bajas",
    icon: Archive,
    exact: true,
  },
  {
    href: "/resguardos/nuevo",
    label: "Nuevo resguardo",
    icon: FilePlus2,
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: Users,
  },
  {
    href: "/catalogos",
    label: "Catálogos",
    icon: BookOpen,
  },
] as const;

const ENCARGADO_ITEMS = [
  {
    href: "/resguardos/nuevo",
    label: "Nuevo resguardo",
    icon: FilePlus2,
  },
] as const;

export default function AppNavigation({ role }: AppNavigationProps) {
  const pathname = usePathname();
  const items = role === USER_ROLES.admin ? ADMIN_ITEMS : ENCARGADO_ITEMS;

  return (
    <nav className={styles.navigation} aria-label="Navegación principal">
      {items.map((item) => {
        const isActive =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${
              isActive ? styles.navLinkActive : ""
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
