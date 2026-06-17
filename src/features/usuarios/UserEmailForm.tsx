"use client";

import { useActionState } from "react";

import FeedbackMessage from "@/components/ui/FeedbackMessage";
import { updateUsuarioEmailAction } from "@/features/usuarios/actions";
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

      {state.message ? (
        <FeedbackMessage
          tone={state.success ? "success" : "error"}
          message={state.message}
        />
      ) : null}
    </form>
  );
}
