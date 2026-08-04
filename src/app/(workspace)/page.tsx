import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/utils/routes";

export default function HomePage() {
  redirect(ROUTES.resguardos);
}
