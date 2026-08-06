"use client";

import type { ReactNode } from "react";

import AppToaster from "@/components/ui/AppToaster";
import { silenceReactDevtoolsNoise } from "@/lib/dev/react-devtools-noise";

silenceReactDevtoolsNoise();

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
