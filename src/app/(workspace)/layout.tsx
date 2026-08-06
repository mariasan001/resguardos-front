import type { ReactNode } from "react";

import AuthenticatedShell from "@/components/layout/AuthenticatedShell";
import { requireSession } from "@/lib/auth/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  return (
    <AuthenticatedShell session={session}>{children}</AuthenticatedShell>
  );
}
