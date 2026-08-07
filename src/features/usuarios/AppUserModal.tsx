"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import AppUserForm from "@/features/usuarios/AppUserForm";
import type { Adscripcion, AppUser, Puesto } from "@/lib/types/api";
import styles from "@/features/usuarios/AppUserModal.module.css";

interface AppUserModalProps {
  adscripciones: Adscripcion[];
  puestos: Puesto[];
  compact?: boolean;
  /** Muestra el botón "Nuevo usuario" (modo create). */
  showCreateTrigger?: boolean;
  /** Usuario a editar; si está definido y open, abre en modo edit. */
  editingUser?: AppUser | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AppUserModal({
  adscripciones,
  puestos,
  compact = false,
  showCreateTrigger = false,
  editingUser = null,
  open: controlledOpen,
  onOpenChange,
}: AppUserModalProps) {
  const router = useRouter();
  const titleId = useId();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const mode = editingUser ? "edit" : "create";

  function setOpen(next: boolean) {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isControlled) {
          setInternalOpen(false);
        }
        onOpenChange?.(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isControlled, onOpenChange, open]);

  return (
    <>
      {showCreateTrigger ? (
        <button
          type="button"
          className={`${styles.trigger} ${compact ? styles.triggerCompact : ""}`}
          onClick={() => setOpen(true)}
        >
          Nuevo usuario
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}

      {open ? (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <div>
                <h3 id={titleId} className={styles.title}>
                  {mode === "create" ? "Nuevo usuario" : "Editar usuario"}
                </h3>
                <p className={styles.description}>
                  {mode === "create"
                    ? "Completa identidad, correo, adscripción y puesto."
                    : "Actualiza los datos del empleado. La clave no se puede cambiar."}
                </p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </header>

            <AppUserForm
              key={editingUser?.neyemp ?? "create"}
              mode={mode}
              user={editingUser ?? undefined}
              stayOnList
              adscripciones={adscripciones}
              puestos={puestos}
              onCancel={() => setOpen(false)}
              onSuccess={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
