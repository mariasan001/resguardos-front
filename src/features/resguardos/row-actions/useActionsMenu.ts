"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function useActionsMenu() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeMenu = () => setOpen(false);

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
    window.addEventListener("resize", closeMenu);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", closeMenu);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const gap = 8;
    const viewportPadding = 12;

    let left = triggerRect.right - menuRect.width;
    let top = triggerRect.bottom + gap;

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (left + menuRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - menuRect.width - viewportPadding;
    }

    if (top + menuRect.height > window.innerHeight - viewportPadding) {
      top = triggerRect.top - menuRect.height - gap;
    }

    if (top < viewportPadding) {
      top = viewportPadding;
    }

    setMenuPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusTarget = menuRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [role="menuitem"]',
    );

    focusTarget?.focus();
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
