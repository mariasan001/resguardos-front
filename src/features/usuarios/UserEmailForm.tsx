"use client";

import { useActionState } from "react";

import { updateUsuarioEmailAction } from "@/features/usuarios/actions";
import useActionToast from "@/hooks/useActionToast";
import type { ActionResult } from "@/lib/types/api";
import styles from "@/features/usuarios/UserEmailForm.module.css";

const initialState: ActionResult = {
  success: false,
  message: "",
};

interface UserEmailFormProps {
  neyemp: string;
  email: string;
}

export default function UserEmailForm({
  neyemp,
  email,
}: UserEmailFormProps) {
  const [state, formAction, pending] = useActionState(
    updateUsuarioEmailAction,
    initialState,
  );
  useActionToast(state, {
    successTitle: "Correo actualizado",
    errorTitle: "No fue posible actualizar el correo",
  });

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="neyemp" value={neyemp} />

      <label className={styles.field}>
        <span className={styles.label}>Correo electrónico</span>
        <input
          className={styles.input}
          type="email"
          name="email"
          defaultValue={email}
          placeholder="usuario@institucion.gob.mx"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        {state.fieldErrors?.email ? (
          <span className={styles.error}>{state.fieldErrors.email}</span>
        ) : null}
      </label>

      <button type="submit" className={styles.button} disabled={pending}>
        {pending ? "Actualizando..." : "Guardar correo"}
      </button>
    </form>
  );
}
