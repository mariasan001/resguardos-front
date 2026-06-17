import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ResguardoCreateForm from "@/features/resguardos/ResguardoCreateForm";
import { getCatalogosBundle } from "@/lib/services/catalogos.service";
import { getUsuarios } from "@/lib/services/usuarios.service";
import { toUserOptions } from "@/lib/utils/format";
import styles from "@/app/(resguardos-list)/resguardos/nuevo/page.module.css";

export default async function NuevoResguardoPage() {
  const [usuarios, catalogos] = await Promise.all([
    getUsuarios(),
    getCatalogosBundle(),
  ]);

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Nuevo resguardo</h1>
          <p className={styles.description}>
            Captura la informacion principal del equipo y del responsable.
          </p>
        </div>

        <Link href="/resguardos" className={styles.backLink}>
          <ArrowLeft size={16} strokeWidth={2} />
          Volver a resguardos
        </Link>
      </div>

      <section className={styles.formShell}>
        <ResguardoCreateForm
          users={toUserOptions(usuarios)}
          catalogos={catalogos}
          cancelHref="/resguardos"
        />
      </section>
    </section>
  );
}
