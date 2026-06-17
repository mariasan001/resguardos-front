"use client";

import {
  BookCopy,
  Boxes,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/components/layout/AppShell";
import MotionList from "@/components/ui/MotionList";
import styles from "@/components/layout/SidebarNav.module.css";

interface SidebarNavProps {
  navigation: NavigationItem[];
}

const iconMap = {
  "/": LayoutDashboard,
  "/resguardos": ShieldCheck,
  "/usuarios": BookCopy,
  "/catalogos": Boxes,
} as const;

export default function SidebarNav({ navigation }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <MotionList as="nav" className={styles.nav} aria-label="Navegacion principal">
      {navigation.map((item) => {
        const active =
          item.href === "/"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = iconMap[item.href as keyof typeof iconMap] ?? LayoutDashboard;

        return (
          <Link
            key={item.href}
            href={item.href}
            data-motion-item
            className={active ? styles.navItemActive : styles.navItem}
          >
            <span className={styles.iconWrap}>
              <Icon size={18} strokeWidth={1.9} />
            </span>
            <span className={styles.copy}>
              <span className={styles.label}>{item.label}</span>
              {item.description ? (
                <span className={styles.description}>{item.description}</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </MotionList>
  );
}
