import Link from "next/link";

import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

export function FormActions({
  cancelHref,
  formError,
  editingResguardoId,
  onContinue,
}: {
  cancelHref: string;
  formError: string;
  editingResguardoId?: number;
  onContinue: () => void;
}) {
  return (
    <div className={styles.actions} data-motion-item>
      {formError ? <p className={styles.formError}>{formError}</p> : null}
      <Link href={cancelHref} className={styles.cancelLink}>
        Cancelar
      </Link>
      <button type="button" className={styles.primaryButton} onClick={onContinue}>
        {editingResguardoId ? "Revisar cambios" : "Revisar resguardo"}
      </button>
    </div>
  );
}
