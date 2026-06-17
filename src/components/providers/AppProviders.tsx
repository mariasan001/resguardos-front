"use client";

import type { ReactNode } from "react";

import AppToaster from "@/components/ui/AppToaster";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      {children}
      <AppToaster />
    </>
  );
}
