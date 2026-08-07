"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const VIEWPORT_PADDING = 12;
const MENU_GAP = 8;

export function useActionsMenu() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;

    if (!trigger || !menu) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    // Trigger scrolled out of view (e.g. under sticky chrome / table header).
    if (
      triggerRect.bottom < VIEWPORT_PADDING ||
      triggerRect.top > window.innerHeight - VIEWPORT_PADDING ||
      triggerRect.right < VIEWPORT_PADDING ||
      triggerRect.left > window.innerWidth - VIEWPORT_PADDING
    ) {
      setOpen(false);
      return;
    }

    let left = triggerRect.right - menuRect.width;
    let top = triggerRect.bottom + MENU_GAP;

    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    if (left + menuRect.width > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - menuRect.width - VIEWPORT_PADDING;
    }

    if (top + menuRect.height > window.innerHeight - VIEWPORT_PADDING) {
      top = triggerRect.top - menuRect.height - MENU_GAP;
    }

    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
    }

    setMenuPosition((current) =>
      current.top === top && current.left === left ? current : { top, left },
    );
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !wrapperRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusTarget = menuRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [role="menuitem"]',
    );

    // preventScroll avoids the table overflow container jumping and
    // immediately closing / misaligning the menu on short monitors.
    focusTarget?.focus({ preventScroll: true });
  }, [open]);

  return {
    wrapperRef,
    triggerRef,
    menuRef,
    open,
    setOpen,
    menuPosition,
  };
}
