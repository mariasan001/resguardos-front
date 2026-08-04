"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type MotionTag = "div" | "section" | "article" | "header" | "aside" | "main" | "nav";
type MotionVariant = "fade" | "fade-up" | "scale";

interface MotionItemProps {
  as?: MotionTag;
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: MotionVariant;
}

gsap.registerPlugin(useGSAP);

export default function MotionItem({
  as = "div",
  children,
  className,
  delay = 0,
  duration = 0.45,
  variant = "fade-up",
}: MotionItemProps) {
  const ref = useRef<HTMLElement | null>(null);
  const Tag = as;

  useGSAP(
    () => {
      if (!ref.current) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(ref.current, { opacity: 1, clearProps: "opacity,transform" });
        return;
      }

      const from =
        variant === "scale"
          ? { opacity: 0, scale: 0.985, y: 10 }
          : variant === "fade"
            ? { opacity: 0 }
            : { opacity: 0, y: 14 };

      gsap.fromTo(
        ref.current,
        from,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration,
          delay,
          ease: "power2.out",
          clearProps: "opacity,transform",
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag
      ref={(node) => {
        ref.current = node as HTMLElement | null;
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
