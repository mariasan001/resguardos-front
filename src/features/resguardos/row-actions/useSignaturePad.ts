"use client";

import SignaturePad from "signature_pad";
import { useEffect, useRef, useState } from "react";

interface UseSignaturePadOptions {
  active: boolean;
  onBeginStroke?: () => void;
}

export function useSignaturePad({ active, onBeginStroke }: UseSignaturePadOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const onBeginStrokeRef = useRef(onBeginStroke);
  const [signatureCaptured, setSignatureCaptured] = useState(false);

  useEffect(() => {
    onBeginStrokeRef.current = onBeginStroke;
  }, [onBeginStroke]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const canvas = canvasRef.current;
    const container = canvasWrapRef.current;

    if (!canvas || !container) {
      return;
    }

    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "rgba(255,255,255,0)",
      penColor: "rgba(28, 34, 43, 0.82)",
      minWidth: 0.25,
      maxWidth: 1.18,
      minDistance: 0.2,
      throttle: 0,
      velocityFilterWeight: 0.86,
    });

    signaturePadRef.current = signaturePad;

    const handleBeginStroke = () => {
      onBeginStrokeRef.current?.();
    };

    const handleEndStroke = () => {
      setSignatureCaptured(!signaturePad.isEmpty());
    };

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = container.getBoundingClientRect();
      const height = window.matchMedia("(max-width: 48rem)").matches ? 168 : 188;
      const existingData = signaturePad.toData();

      canvas.width = rect.width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.scale(ratio, ratio);

      if (existingData.length) {
        signaturePad.fromData(existingData);
      } else {
        signaturePad.clear();
      }
    };

    signaturePad.addEventListener("beginStroke", handleBeginStroke);
    signaturePad.addEventListener("endStroke", handleEndStroke);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      signaturePad.removeEventListener("beginStroke", handleBeginStroke);
      signaturePad.removeEventListener("endStroke", handleEndStroke);
      signaturePad.off();
      signaturePadRef.current = null;
    };
  }, [active]);

  function clearSignature() {
    signaturePadRef.current?.clear();
    setSignatureCaptured(false);
  }

  function getSignaturePad() {
    return signaturePadRef.current;
  }

  function resetCapture() {
    setSignatureCaptured(false);
  }

  return {
    canvasRef,
    canvasWrapRef,
    signatureCaptured,
    clearSignature,
    getSignaturePad,
    resetCapture,
  };
}
