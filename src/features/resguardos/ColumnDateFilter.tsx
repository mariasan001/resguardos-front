"use client";

import { CalendarSearch, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "@/features/resguardos/ColumnDateFilter.module.css";

interface ColumnDateFilterProps {
  param: string;
  ariaLabel: string;
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
});
const fullDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
});

function toKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

/** Días visibles del mes, comenzando en lunes. */
function buildMonthGrid(monthStart: Date) {
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export default function ColumnDateFilter({
  param,
  ariaLabel,
}: ColumnDateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedKey = searchParams.get(param) ?? "";
  const selectedDate = selectedKey ? fromKey(selectedKey) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [monthStart, setMonthStart] = useState(() => {
    const base = selectedDate ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const width = 17.5 * 16;
    const height = popoverRef.current?.offsetHeight ?? 20 * 16;
    const margin = 8;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, margin),
      window.innerWidth - width - margin,
    );

    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const shouldFlip = spaceBelow < height && rect.top > spaceBelow;
    const top = shouldFlip
      ? Math.max(rect.top - height - margin, margin)
      : Math.min(rect.bottom + margin, window.innerHeight - height - margin);

    setPosition({ top: Math.max(top, margin), left });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, updatePosition]);

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

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  function applyValue(key: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (key) {
      next.set(param, key);
    } else {
      next.delete(param);
    }

    next.delete("page");

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setIsOpen(false);
  }

  function shiftMonth(offset: number) {
    setMonthStart(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  const today = new Date();
  const todayKey = toKey(today);
  const days = buildMonthGrid(monthStart);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        data-active={selectedKey ? "true" : undefined}
        onClick={() => {
          const base = selectedDate ?? new Date();
          setMonthStart(new Date(base.getFullYear(), base.getMonth(), 1));
          setIsOpen((current) => !current);
        }}
        aria-label={
          selectedDate
            ? `${ariaLabel}: ${fullDateFormatter.format(selectedDate)}`
            : ariaLabel
        }
        title={ariaLabel}
        aria-expanded={isOpen}
      >
        <CalendarSearch size={13} strokeWidth={2.2} aria-hidden="true" />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popoverRef}
              className={styles.popover}
              style={{ top: position.top, left: position.left }}
              role="dialog"
              aria-label={ariaLabel}
            >
              <header className={styles.header}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() => shiftMonth(-1)}
                  aria-label="Mes anterior"
                >
                  <ChevronLeft size={15} strokeWidth={2.2} aria-hidden="true" />
                </button>

                <span className={styles.monthLabel}>
                  {monthFormatter.format(monthStart)}
                </span>

                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() => shiftMonth(1)}
                  aria-label="Mes siguiente"
                >
                  <ChevronRight size={15} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </header>

              <div className={styles.weekdays} aria-hidden="true">
                {WEEKDAYS.map((weekday, index) => (
                  <span key={`${weekday}-${index}`}>{weekday}</span>
                ))}
              </div>

              <div className={styles.grid}>
                {days.map((date) => {
                  const key = toKey(date);
                  const isOutside = date.getMonth() !== monthStart.getMonth();

                  return (
                    <button
                      key={key}
                      type="button"
                      className={styles.day}
                      data-outside={isOutside || undefined}
                      data-today={key === todayKey || undefined}
                      data-selected={key === selectedKey || undefined}
                      onClick={() => applyValue(key)}
                      aria-label={fullDateFormatter.format(date)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <footer className={styles.footer}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => applyValue(todayKey)}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => applyValue("")}
                  disabled={!selectedKey}
                >
                  Limpiar
                </button>
              </footer>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
