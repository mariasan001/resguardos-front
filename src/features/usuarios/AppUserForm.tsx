"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createAppUserAction,
  updateAppUserAction,
} from "@/features/usuarios/actions";
import useActionToast from "@/hooks/useActionToast";
import type { ActionResult, Adscripcion, AppUser, Puesto } from "@/lib/types/api";
import styles from "@/features/usuarios/AppUserForm.module.css";

const initialState: ActionResult = {
  success: false,
  message: "",
};

interface AppUserFormProps {
  mode: "create" | "edit";
  adscripciones: Adscripcion[];
  puestos: Puesto[];
  user?: AppUser;
  stayOnList?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function AppUserForm({
  mode,
  adscripciones,
  puestos,
  user,
  stayOnList = false,
  onCancel,
  onSuccess,
}: AppUserFormProps) {
  const action = mode === "create" ? createAppUserAction : updateAppUserAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const handledSuccessRef = useRef<ActionResult | null>(null);

  useActionToast(state, {
    successTitle: mode === "create" ? "Usuario creado" : "Usuario actualizado",
    errorTitle:
      mode === "create"
        ? "No fue posible crear el usuario"
        : "No fue posible actualizar el usuario",
  });

  useEffect(() => {
    if (!state.success || !onSuccess || state === handledSuccessRef.current) {
      return;
    }
    handledSuccessRef.current = state;
    onSuccess();
  }, [onSuccess, state]);

  const defaultNecads = user?.adscripcion?.necads ?? "";
  const defaultNeccat = user?.puesto?.id ?? "";

  return (
    <form action={formAction} className={styles.form}>
      {mode === "edit" ? (
        <input type="hidden" name="neyemp" value={user?.neyemp ?? ""} />
      ) : null}
      {stayOnList ? <input type="hidden" name="stayOnList" value="1" /> : null}

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>
            Clave de empleado <span className={styles.required}>*</span>
          </span>
          {mode === "create" ? (
            <input
              className={styles.input}
              name="neyemp"
              defaultValue=""
              placeholder="Ej. 123456789"
              aria-invalid={Boolean(state.fieldErrors?.neyemp)}
              required
            />
          ) : (
            <input
              className={styles.input}
              value={user?.neyemp ?? ""}
              readOnly
              disabled
            />
          )}
          {state.fieldErrors?.neyemp ? (
            <span className={styles.error}>{state.fieldErrors.neyemp}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Nombre completo <span className={styles.required}>*</span>
          </span>
          <input
            className={styles.input}
            name="nombre"
            defaultValue={user?.nombre ?? ""}
            placeholder="Nombre del empleado"
            aria-invalid={Boolean(state.fieldErrors?.nombre)}
            required
          />
          {state.fieldErrors?.nombre ? (
            <span className={styles.error}>{state.fieldErrors.nombre}</span>
          ) : null}
        </label>

        <label className={`${styles.field} ${styles.spanFull}`}>
          <span className={styles.label}>
            Correo electrónico <span className={styles.required}>*</span>
          </span>
          <input
            className={styles.input}
            type="email"
            name="email"
            defaultValue={user?.email ?? ""}
            placeholder="usuario@institucion.gob.mx"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            required
          />
          {state.fieldErrors?.email ? (
            <span className={styles.error}>{state.fieldErrors.email}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Adscripción <span className={styles.required}>*</span>
          </span>
          <select
            className={styles.input}
            name="necads"
            defaultValue={defaultNecads}
            aria-invalid={Boolean(state.fieldErrors?.necads)}
            required
          >
            <option value="">Selecciona una adscripción</option>
            {adscripciones.map((item) => (
              <option key={item.necads} value={item.necads ?? ""}>
                {item.desAds || item.necads}
              </option>
            ))}
          </select>
          {state.fieldErrors?.necads ? (
            <span className={styles.error}>{state.fieldErrors.necads}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Puesto <span className={styles.required}>*</span>
          </span>
          <select
            className={styles.input}
            name="neccat"
            defaultValue={defaultNeccat}
            aria-invalid={Boolean(state.fieldErrors?.neccat)}
            required
          >
            <option value="">Selecciona un puesto</option>
            {puestos.map((item) => (
              <option key={item.id} value={item.id ?? ""}>
                {item.des_neccat || item.id}
              </option>
            ))}
          </select>
          {state.fieldErrors?.neccat ? (
            <span className={styles.error}>{state.fieldErrors.neccat}</span>
          ) : null}
        </label>
      </div>

      <div className={styles.actions}>
        {onCancel ? (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
            disabled={pending}
          >
            Cancelar
          </button>
        ) : null}
        <button type="submit" className={styles.button} disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creando..."
              : "Guardando..."
            : mode === "create"
              ? "Crear usuario"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
