"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const isUnavailable = source.state !== "ready";
  const selectedOption =
    source.options.find((option) => option.value === value) ?? null;
  const placeholder =
    source.state === "error"
      ? "No disponible"
      : source.state === "empty"
        ? "Sin registros"
        : "Selecciona una opcion";

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const margin = 8;
    const width = Math.max(rect.width, 12 * 16);
    const height = popoverRef.current?.offsetHeight ?? 12 * 16;
    const left = Math.min(
      Math.max(rect.left, margin),
      window.innerWidth - width - margin,
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
  }, [isOpen, updatePosition, source.options.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

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
    triggerRef.current?.focus({ preventScroll: true });
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`${styles.fieldBlock} ${className ?? ""}`}>
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
          aria-controls={isOpen ? listboxId : undefined}
          aria-labelledby={`${listboxId}-label`}
        >
          <span className={styles.triggerCopy}>
            <span className={styles.triggerLabel}>
              {selectedOption?.label ?? placeholder}
            </span>
            {selectedOption?.helper ? (
              <span className={styles.triggerHelper}>{selectedOption.helper}</span>
            ) : null}
          </span>
          <ChevronDown
            size={15}
            strokeWidth={2}
            className={styles.chevron}
            data-open={isOpen || undefined}
            aria-hidden="true"
          />
        </button>
      </div>

      {popover}

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
