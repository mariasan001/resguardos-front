"use client";

import { useState } from "react";

import DataTable from "@/components/ui/DataTable";
import AppUserModal from "@/features/usuarios/AppUserModal";
import type { Adscripcion, AppUser, Puesto } from "@/lib/types/api";
import {
  formatSentenceCase,
  formatText,
  formatTitleCase,
} from "@/lib/utils/format";
import styles from "@/features/usuarios/UsuariosTable.module.css";

interface UsuariosTableProps {
  usuarios: AppUser[];
  adscripciones: Adscripcion[];
  puestos: Puesto[];
  search: string;
}

export default function UsuariosTable({
  usuarios,
  adscripciones,
  puestos,
  search,
}: UsuariosTableProps) {
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  function openEdit(user: AppUser) {
    setEditingUser(user);
    setEditOpen(true);
  }

  return (
    <>
      <DataTable
        data={usuarios}
        keyExtractor={(item) => item.neyemp ?? item.nombre ?? item.email ?? "usuario"}
        emptyTitle="Sin usuarios"
        emptyDescription={
          search
            ? `No hay coincidencias para "${search}".`
            : "Aún no hay usuarios registrados. Usa Nuevo usuario para crear el primero."
        }
        columns={[
          {
            key: "clave",
            header: "Clave",
            render: (item) => (
              <button
                type="button"
                className={styles.primaryLink}
                onClick={() => openEdit(item)}
              >
                {formatText(item.neyemp)}
              </button>
            ),
          },
          {
            key: "nombre",
            header: "Nombre",
            render: (item) => formatTitleCase(item.nombre),
          },
          {
            key: "email",
            header: "Correo",
            render: (item) => {
              const email = item.email?.trim();
              return email ? formatSentenceCase(email) : "Sin dato";
            },
          },
          {
            key: "adscripcion",
            header: "Adscripción",
            render: (item) => formatTitleCase(item.adscripcion?.desAds),
          },
          {
            key: "puesto",
            header: "Puesto",
            render: (item) => formatTitleCase(item.puesto?.des_neccat),
          },
        ]}
      />

      <AppUserModal
        adscripciones={adscripciones}
        puestos={puestos}
        editingUser={editingUser}
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) {
            setEditingUser(null);
          }
        }}
      />
    </>
  );
}
