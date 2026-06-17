"use client";

import { useActionState } from "react";

import { sendResguardoEmailAction } from "@/features/email/actions";
import useActionToast from "@/hooks/useActionToast";
import type { ActionResult } from "@/lib/types/api";
import styles from "@/features/email/SendResguardoEmailForm.module.css";

const initialState: ActionResult = {
  success: false,
  message: "",
};

interface SendResguardoEmailFormProps {
  resguardoId: number;
}

export default function SendResguardoEmailForm({
  resguardoId,
}: SendResguardoEmailFormProps) {
  const [state, formAction, pending] = useActionState(
    sendResguardoEmailAction,
    initialState,
  );
  useActionToast(state, {
    successTitle: "Correo enviado",
    errorTitle: "No fue posible enviar el correo",
  });

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="resguardoId" value={String(resguardoId)} />

      <label className={styles.field}>
        <span className={styles.label}>Archivo PDF del resguardo</span>
        <input
          className={styles.input}
          type="file"
          name="archivo"
          accept="application/pdf,.pdf"
          aria-invalid={Boolean(state.fieldErrors?.archivo)}
        />
        {state.fieldErrors?.archivo ? (
          <span className={styles.error}>{state.fieldErrors.archivo}</span>
        ) : null}
      </label>

      <button type="submit" className={styles.button} disabled={pending}>
        {pending ? "Enviando..." : "Cargar PDF y enviar correo"}
      </button>
    </form>
  );
}
