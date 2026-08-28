"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import styles from "@/components/ui/SearchableSelect.module.css";

export interface SearchableOption {
  value: string;
  label: string;
  helper?: string;
}

interface SearchableSelectProps {
  name: string;
  options: SearchableOption[];
  defaultValue?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  onChange?: (value: string) => void;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Quita repetidos: los catálogos traen el mismo nombre con varias claves. */
function dedupeByLabel(options: SearchableOption[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = normalize(`${option.label}|${option.helper ?? ""}`);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export default function SearchableSelect({
  name,
  options,
  defaultValue = "",
  placeholder = "Selecciona una opción",
  searchPlaceholder = "Escribe para buscar",
  emptyMessage = "Sin coincidencias",
  required = false,
  invalid = false,
  disabled = false,
  id,
  onChange,
}: SearchableSelectProps) {
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const uniqueOptions = useMemo(() => dedupeByLabel(options), [options]);

  const selectedOption =
    uniqueOptions.find((option) => option.value === value) ??
    options.find((option) => option.value === value) ??
    null;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return uniqueOptions;
    }

    return uniqueOptions.filter((option) =>
      normalize(`${option.label} ${option.helper ?? ""}`).includes(
        normalizedQuery,
      ),
    );
  }, [query, uniqueOptions]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    const width = Math.max(rect.width, 14 * 16);
    const height = popoverRef.current?.offsetHeight ?? 16 * 16;
    const left = Math.min(
      Math.max(rect.left, margin),
      Math.max(window.innerWidth - width - margin, margin),
    );
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const shouldFlip = spaceBelow < height && rect.top > spaceBelow;
    const top = shouldFlip
      ? Math.max(rect.top - height - margin, margin)
      : Math.min(rect.bottom + margin, window.innerHeight - height - margin);

    setPosition({
      top: Math.max(top, margin),
      left,
      width: Math.min(width, window.innerWidth - margin * 2),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, updatePosition, filteredOptions.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    searchRef.current?.focus({ preventScroll: true });

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }

      close();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        triggerRef.current?.focus({ preventScroll: true });
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return;
    }

    const list = listRef.current;
    const item = list?.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  function close() {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function open() {
    if (disabled) {
      return;
    }

    setQuery("");
    setActiveIndex(uniqueOptions.findIndex((option) => option.value === value));
    setIsOpen(true);
  }

  function commit(nextValue: string) {
    setValue(nextValue);
    onChange?.(nextValue);
    close();
    triggerRef.current?.focus({ preventScroll: true });
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;

      setActiveIndex((current) => {
        if (!filteredOptions.length) {
          return -1;
        }

        const next = current + direction;

        if (next < 0) {
          return filteredOptions.length - 1;
        }

        return next >= filteredOptions.length ? 0 : next;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option =
        filteredOptions[activeIndex] ??
        (filteredOptions.length === 1 ? filteredOptions[0] : undefined);

      if (option) {
        commit(option.value);
      }
    }
  }

  const popover =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
          >
            <div className={styles.searchRow}>
              <Search size={14} strokeWidth={2} aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                className={styles.searchInput}
                value={query}
                placeholder={searchPlaceholder}
                autoComplete="off"
                aria-controls={listboxId}
                aria-autocomplete="list"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            {filteredOptions.length ? (
              <ul ref={listRef} className={styles.list} role="listbox" id={listboxId}>
                {filteredOptions.map((option, index) => {
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
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => commit(option.value)}
                      >
                        <span className={styles.optionCopy}>
                          <span className={styles.optionLabel}>{option.label}</span>
                          {option.helper ? (
                            <span className={styles.optionHelper}>
                              {option.helper}
                            </span>
                          ) : null}
                        </span>
                        {isSelected ? (
                          <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.empty}>{emptyMessage}</p>
            )}
          </div>,
          document.body,
        )
      : null;

    return (
    <>
      <input type="hidden" name={name} value={value} required={required} />

      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={styles.trigger}
        data-empty={!selectedOption || undefined}
        data-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
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

      {popover}
    </>
  );
}
