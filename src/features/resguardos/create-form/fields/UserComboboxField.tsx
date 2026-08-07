"use client";

import { ChevronsUpDown, CircleX } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { OptionItem } from "@/lib/types/api";
import styles from "@/features/resguardos/ResguardoCreateForm.module.css";

import { getSpanClass, normalizeSearch } from "../helpers";
import type { SelectFieldProps } from "../types";
import { FieldLabel } from "./FieldLabel";

export function UserComboboxField({
  label,
  name,
  source,
  value,
  span = "full",
  required,
  invalid,
  onChange,
}: SelectFieldProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const wrapperRef = useRef<HTMLLabelElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedOption = source.options.find((option) => option.value === value) ?? null;
  const normalizedQuery = normalizeSearch(query);

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return source.options.slice(0, 10);
    }

    return source.options
      .filter((option) => {
        const haystack = option.searchText
          ? normalizeSearch(option.searchText)
          : normalizeSearch(`${option.label} ${option.helper ?? ""} ${option.email ?? ""}`);
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 10);
  }, [normalizedQuery, source.options]);

  const displayValue = isOpen ? query : selectedOption?.label ?? query;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isOpen]);

  function emitValueChange(nextValue: string) {
    onChange?.({
      target: { value: nextValue, name },
    } as never);
  }

  function commitSelection(option: OptionItem) {
    emitValueChange(option.value);
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function clearSelection() {
    emitValueChange("");
    setQuery("");
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, filteredOptions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) {
        commitSelection(option);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
  }

  const isUnavailable = source.state !== "ready";

  return (
    <label
      ref={wrapperRef}
      className={`${styles.fieldBlock} ${getSpanClass(span)}`}
    >
      <FieldLabel label={label} required={required} />
      <div
        className={`${styles.combobox} ${isOpen ? styles.comboboxOpen : ""} ${
          isUnavailable ? styles.comboboxDisabled : ""
        } ${invalid ? styles.comboboxInvalid : ""}`}
      >
        <input
          ref={inputRef}
          id={inputId}
          className={styles.comboboxInput}
          type="text"
          role="combobox"
          name={`${name}-search`}
          autoComplete="off"
          placeholder="Buscar por nombre o numero de servidor publico"
          value={displayValue}
          disabled={isUnavailable}
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />

        {selectedOption ? (
          <button
            type="button"
            className={styles.comboboxClear}
            onClick={clearSelection}
            aria-label={`Limpiar ${label.toLowerCase()}`}
          >
            <CircleX size={16} strokeWidth={1.8} />
          </button>
        ) : null}

        <span className={styles.comboboxChevron}>
          <ChevronsUpDown size={16} strokeWidth={1.8} />
        </span>

        {isOpen && !isUnavailable ? (
          <div className={styles.comboboxPopover}>
            {filteredOptions.length ? (
              <ul id={listboxId} className={styles.comboboxList} role="listbox">
                {filteredOptions.map((option, index) => (
                  <li key={`${name}-${option.value}`}>
                    <button
                      id={`${listboxId}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      className={`${styles.comboboxOption} ${
                        index === activeIndex ? styles.comboboxOptionActive : ""
                      }`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => commitSelection(option)}
                    >
                      <span className={styles.comboboxPrimary}>{option.label}</span>
                      {option.helper ? (
                        <span className={styles.comboboxSecondary}>{option.helper}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.comboboxEmpty}>No se encontraron usuarios</div>
            )}
          </div>
        ) : null}
      </div>
      {source.message ? (
        <span
          className={`${styles.fieldHint} ${
            source.state === "error" ? styles.fieldHintError : ""
          }`}
        >
          {source.message}
        </span>
      ) : null}
    </label>
  );
}
