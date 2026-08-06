import FormSelect from "@/features/resguardos/FormSelect";

import { getSpanClass } from "../helpers";
import type { SelectFieldProps } from "../types";

export function SelectField({
  label,
  name,
  source,
  value,
  span = "full",
  required,
  invalid,
  onChange,
}: SelectFieldProps) {
  return (
    <FormSelect
      label={label}
      name={name}
      source={source}
      value={value ?? ""}
      required={required}
      invalid={invalid}
      className={getSpanClass(span)}
      onChange={(nextValue) =>
        onChange?.({ target: { value: nextValue, name } } as never)
      }
    />
  );
}
