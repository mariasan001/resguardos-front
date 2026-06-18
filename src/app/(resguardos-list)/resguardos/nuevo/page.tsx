import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ResguardoCreateForm from "@/features/resguardos/ResguardoCreateForm";
import {
  getAccesorios,
  getColoresMateriales,
  getModelos,
  getProcesadores,
  getSistemasOperativos,
  getTiposBien,
} from "@/lib/services/catalogos.service";
import { getUsuarios } from "@/lib/services/usuarios.service";
import type { OptionItem, SelectOptionsSource } from "@/lib/types/api";
import { toUserOptions } from "@/lib/utils/format";
import styles from "@/app/(resguardos-list)/resguardos/nuevo/page.module.css";

function buildOptionsSource(
  result: PromiseSettledResult<OptionItem[]>,
  emptyMessage: string,
  errorMessage: string,
): SelectOptionsSource {
  if (result.status === "rejected") {
    return {
      options: [],
      state: "error",
      message: errorMessage,
    };
  }

  if (!result.value.length) {
    return {
      options: [],
      state: "empty",
      message: emptyMessage,
    };
  }

  return {
    options: result.value,
    state: "ready",
  };
}

interface NuevoResguardoPageProps {
  searchParams: Promise<{
    continue?: string;
  }>;
}

export default async function NuevoResguardoPage({
  searchParams,
}: NuevoResguardoPageProps) {
  const params = await searchParams;
  const preserveDraft = params.continue === "1";
  const [
    usuariosResult,
    accesoriosResult,
    coloresResult,
    modelosResult,
    procesadoresResult,
    sistemasOperativosResult,
    tiposBienResult,
  ] = await Promise.allSettled([
    getUsuarios().then(toUserOptions),
    getAccesorios().then((items) =>
      items.map((item) => ({
        value: String(item.id ?? ""),
        label: item.descAccesorio ?? "Sin descripcion",
      })),
    ),
    getColoresMateriales().then((items) =>
      items.map((item) => ({
        value: String(item.id ?? ""),
        label: item.descMaterial ?? "Sin descripcion",
      })),
    ),
    getModelos().then((items) =>
      items.map((item) => ({
        value: String(item.id ?? ""),
        label: item.descModelo ?? "Sin descripcion",
      })),
    ),
    getProcesadores().then((items) =>
      items.map((item) => ({
        value: String(item.id ?? ""),
        label: item.descProcesador ?? "Sin descripcion",
      })),
    ),
    getSistemasOperativos().then((items) =>
      items.map((item) => ({
        value: String(item.id ?? ""),
        label: item.descSo ?? "Sin descripcion",
      })),
    ),
    getTiposBien().then((items) =>
      items.map((item) => ({
        value: String(item.id ?? ""),
        label: item.descTipoBien ?? "Sin descripcion",
      })),
    ),
  ]);

  const sources = {
    usuarios: buildOptionsSource(
      usuariosResult,
      "No hay usuarios disponibles por ahora.",
      "No fue posible cargar los usuarios.",
    ),
    accesorios: buildOptionsSource(
      accesoriosResult,
      "No hay accesorios disponibles por ahora.",
      "No fue posible cargar el catalogo de accesorios.",
    ),
    colores: buildOptionsSource(
      coloresResult,
      "No hay colores o materiales disponibles por ahora.",
      "No fue posible cargar el catalogo de color o material.",
    ),
    modelos: buildOptionsSource(
      modelosResult,
      "No hay modelos disponibles por ahora.",
      "No fue posible cargar el catalogo de modelos.",
    ),
    procesadores: buildOptionsSource(
      procesadoresResult,
      "No hay procesadores disponibles por ahora.",
      "No fue posible cargar el catalogo de procesadores.",
    ),
    sistemasOperativos: buildOptionsSource(
      sistemasOperativosResult,
      "No hay sistemas operativos disponibles por ahora.",
      "No fue posible cargar el catalogo de sistemas operativos.",
    ),
    tiposBien: buildOptionsSource(
      tiposBienResult,
      "No hay tipos de bien disponibles por ahora.",
      "No fue posible cargar el catalogo de tipos de bien.",
    ),
  };

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
          sources={sources}
          cancelHref="/resguardos"
          preserveDraft={preserveDraft}
        />
      </section>
    </section>
  );
}
