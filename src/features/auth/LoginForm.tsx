"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { useActionState, useState } from "react";

import { loginAction } from "@/features/auth/actions";
import type { LoginActionState } from "@/lib/auth/types";
import styles from "@/features/auth/LoginForm.module.css";

const INITIAL_STATE: LoginActionState = {
  success: false,
};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_STATE,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.field}>
        <label htmlFor="username">Usuario</label>
        <div
          className={`${styles.inputWrap} ${
            state.fieldErrors?.username ? styles.inputWrapError : ""
          }`}
        >
          <UserRound size={18} aria-hidden="true" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            placeholder="Ingresa tu usuario"
            aria-invalid={Boolean(state.fieldErrors?.username)}
            aria-describedby={
              state.fieldErrors?.username ? "username-error" : undefined
            }
            disabled={pending}
          />
        </div>
        {state.fieldErrors?.username ? (
          <p id="username-error" className={styles.fieldError}>
            {state.fieldErrors.username}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Contraseña</label>
        <div
          className={`${styles.inputWrap} ${
            state.fieldErrors?.password ? styles.inputWrapError : ""
          }`}
        >
          <LockKeyhole size={18} aria-hidden="true" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={
              state.fieldErrors?.password ? "password-error" : undefined
            }
            disabled={pending}
          />
          <button
            type="button"
            className={styles.visibilityButton}
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            disabled={pending}
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <p id="password-error" className={styles.fieldError}>
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className={styles.formMessage} role="alert">
          {state.message}
        </p>
      ) : null}

      <button type="submit" className={styles.submitButton} disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle
              className={styles.spinner}
              size={18}
              aria-hidden="true"
            />
            Validando acceso
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>
    </form>
  );
}
