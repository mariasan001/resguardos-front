"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import type { SelectOptionsSource } from "@/lib/types/api";
import styles from "@/features/resguardos/FormSelect.module.css";

interface FormSelectProps {
  label: string;
  name: string;
  source: SelectOptionsSource;
  value: string;
  className?: string;
  required?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}

export default function FormSelect({
  label,
  name,
  source,
  value,
  className,
  required = false,
  invalid = false,
  onChange,
}: FormSelectProps) {
  const listboxId = `${useId()}-listbox`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isUnavailable = source.state !== "ready";
  const selectedOption =
    source.options.find((option) => option.value === value) ?? null;
  const placeholder =
    source.state === "error"
      ? "No disponible"
      : source.state === "empty"
        ? "Sin registros"
        : "Selecciona una opcion";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  function open() {
    if (isUnavailable) {
      return;
    }

    const selectedIndex = source.options.findIndex(
      (option) => option.value === value,
    );
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  }

  function commit(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (isUnavailable) {
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        open();
        return;
      }

      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + direction;

        if (next < 0) {
          return source.options.length - 1;
        }

        return next >= source.options.length ? 0 : next;
      });
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      const option = source.options[activeIndex];
      commit(option ? option.value : "");
    }
  }

  return (
    <div className={`${styles.fieldBlock} ${className ?? ""}`} ref={wrapperRef}>
      <span className={styles.label} id={`${listboxId}-label`}>
        {label}
        {required ? (
          <span className={styles.requiredMark} aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </span>
      <input type="hidden" name={name} value={value} />

      <div className={styles.control}>
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          data-empty={!selectedOption || undefined}
          data-invalid={invalid || undefined}
          disabled={isUnavailable}
          onClick={() => (isOpen ? setIsOpen(false) : open())}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`${listboxId}-label`}
        >
          <span className={styles.triggerLabel}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown
            size={15}
            strokeWidth={2}
            className={styles.chevron}
            data-open={isOpen || undefined}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <div className={styles.popover}>
            <ul className={styles.list} role="listbox" id={listboxId}>
              <li>
                <button
                  type="button"
                  className={styles.option}
                  data-active={activeIndex === -1 || undefined}
                  data-selected={!selectedOption || undefined}
                  role="option"
                  aria-selected={!selectedOption}
                  onMouseEnter={() => setActiveIndex(-1)}
                  onClick={() => commit("")}
                >
                  <span className={styles.optionLabel}>{placeholder}</span>
                  {!selectedOption ? (
                    <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                  ) : null}
                </button>
              </li>

              {source.options.map((option, index) => {
                const isSelected = option.value === value;

                return (
                  <li key={`${name}-${option.value}`}>
                    <button
                      type="button"
                      className={styles.option}
                      data-active={activeIndex === index || undefined}
                      data-selected={isSelected || undefined}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => commit(option.value)}
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      {isSelected ? (
                        <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      {source.message ? (
        <span
          className={`${styles.hint} ${
            source.state === "error" ? styles.hintError : ""
          }`}
        >
          {source.message}
        </span>
      ) : null}
    </div>
  );
}
