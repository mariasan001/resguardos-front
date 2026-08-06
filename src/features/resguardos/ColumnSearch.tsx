"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import styles from "@/features/resguardos/ColumnSearch.module.css";

interface ColumnSearchProps {
  param: string;
  placeholder: string;
  ariaLabel: string;
}

const DEBOUNCE_MS = 280;

export default function ColumnSearch({
  param,
  placeholder,
  ariaLabel,
}: ColumnSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const valueFromUrl = searchParams.get(param) ?? "";
  const [value, setValue] = useState(valueFromUrl);
  const [isOpen, setIsOpen] = useState(Boolean(valueFromUrl));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastSynced = useRef(valueFromUrl);

  useEffect(() => {
    if (valueFromUrl !== lastSynced.current) {
      lastSynced.current = valueFromUrl;
      setValue(valueFromUrl);
    }
  }, [valueFromUrl]);

  useEffect(() => {
    if (value === valueFromUrl) {
      return;
    }

    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();

      if (trimmed) {
        next.set(param, trimmed);
      } else {
        next.delete(param);
      }

      next.delete("page");

      const query = next.toString();
      lastSynced.current = trimmed;
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, valueFromUrl, param, pathname, router, searchParams]);

  function open() {
    setIsOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function close() {
    setValue("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className={styles.trigger}
        onClick={open}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <Search size={13} strokeWidth={2.2} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={styles.field} data-pending={isPending || undefined}>
      <Search size={12} strokeWidth={2.2} className={styles.icon} aria-hidden="true" />
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            close();
          }
        }}
        onBlur={() => {
          if (!value.trim()) {
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        className={styles.clear}
        onMouseDown={(event) => event.preventDefault()}
        onClick={close}
        aria-label={`Cerrar ${ariaLabel.toLowerCase()}`}
      >
        <X size={12} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
