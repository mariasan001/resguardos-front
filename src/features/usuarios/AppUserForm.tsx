"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";

import SearchableSelect from "@/components/ui/SearchableSelect";
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

  const adscripcionOptions = useMemo(
    () =>
      adscripciones.map((item) => ({
        value: item.necads ?? "",
        label: item.desAds || item.necads || "",
      })),
    [adscripciones],
  );

  const puestoOptions = useMemo(
    () =>
      puestos.map((item) => ({
        value: String(item.id ?? ""),
        label: item.des_neccat || String(item.id ?? ""),
      })),
    [puestos],
  );

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

        <div className={styles.field}>
          <span className={styles.label}>
            Adscripción <span className={styles.required}>*</span>
          </span>
          <SearchableSelect
            name="necads"
            options={adscripcionOptions}
            defaultValue={defaultNecads}
            placeholder="Selecciona una adscripción"
            searchPlaceholder="Escribe para buscar una adscripción"
            invalid={Boolean(state.fieldErrors?.necads)}
            required
          />
          {state.fieldErrors?.necads ? (
            <span className={styles.error}>{state.fieldErrors.necads}</span>
          ) : null}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>
            Puesto <span className={styles.required}>*</span>
          </span>
          <SearchableSelect
            name="neccat"
            options={puestoOptions}
            defaultValue={defaultNeccat}
            placeholder="Selecciona un puesto"
            searchPlaceholder="Escribe para buscar un puesto"
            invalid={Boolean(state.fieldErrors?.neccat)}
            required
          />
          {state.fieldErrors?.neccat ? (
            <span className={styles.error}>{state.fieldErrors.neccat}</span>
          ) : null}
        </div>
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
