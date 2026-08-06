import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

export function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className={styles.label}>
      {label}
      {required ? (
        <span className={styles.requiredMark} aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </span>
  );
}
