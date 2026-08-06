import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { getSpanClass } from "../helpers";
import type { BaseFieldProps } from "../types";
import { FieldLabel } from "./FieldLabel";

export function Field({
  label,
  name,
  value,
  defaultValue,
  placeholder,
  readOnly,
  required,
  invalid,
  span = "full",
  onChange,
}: BaseFieldProps) {
  return (
    <label className={`${styles.fieldBlock} ${getSpanClass(span)}`}>
      <FieldLabel label={label} required={required} />
      <input
        className={`${styles.input} ${invalid ? styles.inputInvalid : ""}`}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid || undefined}
        aria-readonly={readOnly || undefined}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
      />
    </label>
  );
}
