"use client";

import { useRef, type HTMLAttributes } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type MotionListTag = "div" | "section" | "nav";

interface MotionListProps extends HTMLAttributes<HTMLElement> {
  as?: MotionListTag;
  className?: string;
  selector?: string;
  stagger?: number;
  delay?: number;
}

gsap.registerPlugin(useGSAP);

export default function MotionList({
  as = "div",
  children,
  className,
  selector = "[data-motion-item]",
  stagger = 0.06,
  delay = 0,
  ...props
}: MotionListProps) {
  const ref = useRef<HTMLElement | null>(null);
  const Tag = as;

  useGSAP(
    () => {
      if (!ref.current) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(ref.current.querySelectorAll(selector), {
          opacity: 1,
          clearProps: "opacity,transform",
        });
        return;
      }

      const items = ref.current.querySelectorAll(selector);
      if (!items.length) {
        return;
      }

      // Opacity-only: transforms on <tr> are unreliable and can block interaction.
      gsap.fromTo(
        items,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.42,
          delay,
          stagger,
          ease: "power2.out",
          clearProps: "opacity",
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
      {...props}
    >
      {children}
    </Tag>
  );
}
