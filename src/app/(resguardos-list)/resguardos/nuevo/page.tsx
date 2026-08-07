import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ResguardoCreateForm from "@/features/resguardos/ResguardoCreateForm";
import { getHomeRoute } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/types";
import {
  getAccesorios,
  getColoresMateriales,
  getMarcas,
  getModelos,
  getProcesadores,
  getSistemasOperativos,
  getTiposBien,
} from "@/lib/services/catalogos.service";
import { getResguardoByIdServer } from "@/lib/services/resguardos.server";
import { getUsuarios } from "@/lib/services/usuarios.server";
import type { Accesorio, OptionItem, SelectOptionsSource } from "@/lib/types/api";
import { toUserOptions } from "@/lib/utils/format";
import { completeResguardoAccesorios } from "@/lib/utils/resguardo-accesorios";
import { mapResguardoToEditDraft } from "@/lib/utils/resguardo-payload";
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

function toAccesorioOptions(items: Accesorio[]): OptionItem[] {
  return items.map((item) => ({
    value: String(item.id ?? ""),
    label: item.descAccesorio ?? "Sin descripcion",
    searchText: (item.descAccesorio ?? "").toLowerCase(),
  }));
}

interface NuevoResguardoPageProps {
  searchParams: Promise<{
    continue?: string;
    edit?: string;
  }>;
}

export default async function NuevoResguardoPage({
  searchParams,
}: NuevoResguardoPageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const preserveDraft = params.continue === "1";
  const isAdmin = session.role === USER_ROLES.admin;
  const cancelHref = getHomeRoute(session.role);
  const editId = isAdmin ? Number(params.edit) : Number.NaN;
  const isEditing = Number.isInteger(editId) && editId > 0;

  const [
    usuariosResult,
    accesoriosCatalogResult,
    coloresResult,
    marcasResult,
    modelosResult,
    procesadoresResult,
    sistemasOperativosResult,
    tiposBienResult,
    editResguardoResult,
  ] = await Promise.allSettled([
    getUsuarios().then(toUserOptions),
    getAccesorios(),
    getColoresMateriales().then((items) =>
      items.map((item) => ({
        value: String(item.id ?? ""),
        label: item.descMaterial ?? "Sin descripcion",
      })),
    ),
    getMarcas().then((items) =>
      items.map((item) => ({
        value: String(item.id ?? ""),
        label: item.descMarca ?? "Sin descripcion",
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
    isEditing && !preserveDraft
      ? getResguardoByIdServer(editId)
      : Promise.resolve(null),
  ]);

  const accesoriosCatalog =
    accesoriosCatalogResult.status === "fulfilled"
      ? accesoriosCatalogResult.value
      : [];
  const accesoriosResult: PromiseSettledResult<OptionItem[]> =
    accesoriosCatalogResult.status === "fulfilled"
      ? {
          status: "fulfilled",
          value: toAccesorioOptions(accesoriosCatalogResult.value),
        }
      : {
          status: "rejected",
          reason: accesoriosCatalogResult.reason,
        };

  const editDraft =
    editResguardoResult.status === "fulfilled" && editResguardoResult.value
      ? mapResguardoToEditDraft(
          completeResguardoAccesorios(
            editResguardoResult.value,
            accesoriosCatalog,
          ),
        )
      : null;

  if (isEditing && !preserveDraft && !editDraft?.editingResguardoId) {
    notFound();
  }

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
    marcas: buildOptionsSource(
      marcasResult,
      "No hay marcas disponibles por ahora.",
      "No fue posible cargar el catalogo de marcas.",
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
          <h1 className={styles.title}>
            {isEditing ? "Editar resguardo" : "Nuevo resguardo"}
          </h1>
          <p className={styles.description}>
            {isEditing
              ? "Actualiza la informacion del equipo y del responsable."
              : "Captura la informacion principal del equipo y del responsable."}
          </p>
        </div>

        {isAdmin ? (
          <Link href="/resguardos" className={styles.backLink}>
            <ArrowLeft size={16} strokeWidth={2} />
            Volver a resguardos
          </Link>
        ) : null}
      </div>

      <section className={styles.formShell}>
        <ResguardoCreateForm
          sources={sources}
          cancelHref={cancelHref}
          preserveDraft={preserveDraft}
          serverDraft={editDraft}
        />
      </section>
    </section>
  );
}
