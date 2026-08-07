import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";

export default async function NuevoUsuarioPage() {
  await requireRole([USER_ROLES.admin]);
  redirect("/usuarios");
}
