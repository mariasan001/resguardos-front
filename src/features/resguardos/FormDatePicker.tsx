"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import styles from "@/features/resguardos/FormDatePicker.module.css";

interface FormDatePickerProps {
  label: string;
  name: string;
  value: string;
  className?: string;
  required?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
});
const displayFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDateTimeValue(date: Date) {
  return `${toDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateTimeValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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

function getNowTime() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function FormDatePicker({
  label,
  name,
  value,
  className,
  required = false,
  invalid = false,
  onChange,
}: FormDatePickerProps) {
  const selectedDate = useMemo(() => parseDateTimeValue(value), [value]);
  const today = startOfDay(new Date());
  const todayKey = toDateKey(today);

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [monthStart, setMonthStart] = useState(() => {
    const base = selectedDate ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [draftTime, setDraftTime] = useState(() => {
    if (selectedDate) {
      return `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`;
    }

    return getNowTime();
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const width = 18.5 * 16;
    const height = popoverRef.current?.offsetHeight ?? 22 * 16;
    const margin = 8;
    const left = Math.min(
      Math.max(rect.left, margin),
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

  function openPicker() {
    const base = selectedDate ?? today;
    setMonthStart(new Date(base.getFullYear(), base.getMonth(), 1));
    setDraftTime(
      selectedDate
        ? `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`
        : getNowTime(),
    );
    setIsOpen(true);
  }

  function buildDateTime(date: Date, time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const next = new Date(date);
    next.setHours(hours || 0, minutes || 0, 0, 0);

    if (toDateKey(next) === todayKey && next > new Date()) {
      return new Date();
    }

    return next;
  }

  function applyDate(date: Date) {
    if (startOfDay(date) > today) {
      return;
    }

    const next = buildDateTime(date, draftTime);
    setDraftTime(`${pad(next.getHours())}:${pad(next.getMinutes())}`);
    onChange(toDateTimeValue(next));
    setIsOpen(false);
  }

  function applyTime(time: string) {
    setDraftTime(time);

    if (!selectedDate) {
      return;
    }

    onChange(toDateTimeValue(buildDateTime(selectedDate, time)));
  }

  function applyToday() {
    const now = new Date();
    setDraftTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    onChange(toDateTimeValue(now));
    setIsOpen(false);
  }

  function clearValue() {
    onChange("");
    setIsOpen(false);
  }

  const days = buildMonthGrid(monthStart);

  return (
    <div className={`${styles.fieldBlock} ${className ?? ""}`}>
      <span className={styles.label} id={`${name}-label`}>
        {label}
        {required ? (
          <span className={styles.requiredMark} aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </span>
      <input type="hidden" name={name} value={value} />

      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        data-empty={!value || undefined}
        data-invalid={invalid || undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={`${name}-label`}
      >
        <span>
          {selectedDate
            ? displayFormatter.format(selectedDate)
            : "Seleccionar fecha"}
        </span>
        <CalendarDays size={16} strokeWidth={1.9} aria-hidden="true" />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popoverRef}
              className={styles.popover}
              style={{ top: position.top, left: position.left }}
              role="dialog"
              aria-label={label}
            >
              <header className={styles.header}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() =>
                    setMonthStart(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() - 1, 1),
                    )
                  }
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
                  onClick={() =>
                    setMonthStart((current) => {
                      const next = new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        1,
                      );
                      const limit = new Date(today.getFullYear(), today.getMonth(), 1);
                      return next > limit ? current : next;
                    })
                  }
                  aria-label="Mes siguiente"
                  disabled={
                    monthStart.getFullYear() > today.getFullYear() ||
                    (monthStart.getFullYear() === today.getFullYear() &&
                      monthStart.getMonth() >= today.getMonth())
                  }
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
                  const key = toDateKey(date);
                  const isOutside = date.getMonth() !== monthStart.getMonth();
                  const isFuture = startOfDay(date) > today;
                  const isSelected =
                    selectedDate !== null && toDateKey(selectedDate) === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      className={styles.day}
                      data-outside={isOutside || undefined}
                      data-today={key === todayKey || undefined}
                      data-selected={isSelected || undefined}
                      data-disabled={isFuture || undefined}
                      disabled={isFuture}
                      onClick={() => applyDate(date)}
                      aria-label={date.toLocaleDateString("es-MX", {
                        dateStyle: "long",
                      })}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className={styles.timeRow}>
                <label className={styles.timeField}>
                  <span>Hora</span>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={draftTime}
                    max={
                      selectedDate && toDateKey(selectedDate) === todayKey
                        ? getNowTime()
                        : undefined
                    }
                    onChange={(event) => applyTime(event.target.value)}
                  />
                </label>
              </div>

              <footer className={styles.footer}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={clearValue}
                  disabled={!value}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  className={styles.actionPrimary}
                  onClick={applyToday}
                >
                  Hoy
                </button>
              </footer>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
