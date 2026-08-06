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
import { getResguardoByIdServer, getResguardos } from "@/lib/services/resguardos.server";
import { getUsuarios } from "@/lib/services/usuarios.server";
import type { OptionItem, SelectOptionsSource } from "@/lib/types/api";
import { getMarcaId, getMarcaLabel, toUserOptions } from "@/lib/utils/format";
import { getNextInventoryId } from "@/lib/utils/inventory-id";
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
  // Con continue=1 el borrador vive en el cliente: volver a leer el backend
  // sobrescribiria los cambios que el usuario aun no confirma.
  const editDraft =
    isEditing && !preserveDraft
      ? mapResguardoToEditDraft(await getResguardoByIdServer(editId))
      : null;

  if (isEditing && !preserveDraft && !editDraft?.editingResguardoId) {
    notFound();
  }
  const [
    usuariosResult,
    accesoriosResult,
    coloresResult,
    marcasResult,
    modelosResult,
    procesadoresResult,
    sistemasOperativosResult,
    tiposBienResult,
    resguardosResult,
  ] = await Promise.allSettled([
    getUsuarios().then(toUserOptions),
    getAccesorios().then((items) =>
      items.map((item) => {
        const marcaLabel = getMarcaLabel(item.marca);

        return {
          value: String(item.id ?? ""),
          label: item.descAccesorio ?? "Sin descripcion",
          marca: marcaLabel || undefined,
          marcaId: getMarcaId(item.marca, item.idMarca) || undefined,
          modelo: item.modelo?.trim() || undefined,
          helper: [marcaLabel, item.modelo].filter(Boolean).join(" · ") || undefined,
          searchText: [item.descAccesorio, marcaLabel, item.modelo]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        };
      }),
    ),
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
    getResguardos(),
  ]);
  if (resguardosResult.status === "rejected") {
    throw new Error(
      "No fue posible calcular el siguiente folio de inventario sin riesgo de duplicarlo.",
      { cause: resguardosResult.reason },
    );
  }

  const nextInventoryId = getNextInventoryId(resguardosResult.value);

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
          generatedInventoryId={nextInventoryId}
        />
      </section>
    </section>
  );
}
