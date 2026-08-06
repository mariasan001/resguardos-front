import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { getSpanClass } from "../helpers";
import type { BaseFieldProps } from "../types";
import { FieldLabel } from "./FieldLabel";

export function StaticUserField({
  label,
  value,
  helper,
  span = "full",
  required,
  invalid,
}: {
  label: string;
  value: string;
  helper?: string;
  span?: BaseFieldProps["span"];
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <FieldLabel label={label} required={required} />
      <div
        className={`${styles.staticUserField} ${
          invalid ? styles.staticUserFieldInvalid : ""
        }`}
      >
        <span className={styles.staticUserValue}>{value}</span>
      </div>
      {helper ? <span className={styles.fieldHint}>{helper}</span> : null}
    </label>
  );
}
