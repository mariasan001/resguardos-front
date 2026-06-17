"use client";

import { CheckCircle2, Eraser, FileCheck2, PenLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { notify } from "@/lib/utils/notify";
import styles from "@/features/resguardos/ResguardoVerificationCard.module.css";

interface ResguardoVerificationCardProps {
  titular: string;
  inventario: string;
}

export default function ResguardoVerificationCard({
  titular,
  inventario,
}: ResguardoVerificationCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const movedRef = useRef(false);
  const [isSigned, setIsSigned] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = 220 * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = "220px";

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2;
    context.strokeStyle = "#0f172a";
  }, []);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");
    const point = getPoint(event);

    if (!context || !point) {
      return;
    }

    drawingRef.current = true;
    movedRef.current = false;
    canvasRef.current?.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    const context = canvasRef.current?.getContext("2d");
    const point = getPoint(event);

    if (!context || !point) {
      return;
    }

    movedRef.current = true;
    context.lineTo(point.x, point.y);
    context.stroke();
    setIsSigned(true);
  }

  function endDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    canvasRef.current?.releasePointerCapture(event.pointerId);

    if (movedRef.current) {
      setIsSigned(true);
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  }

  function confirmReception() {
    if (!accepted) {
      notify.warning(
        "Confirma la información",
        "Marca la validación antes de confirmar la recepción del resguardo.",
      );
      return;
    }

    if (!isSigned) {
      notify.warning(
        "Falta la firma",
        "Solicita la firma del titular para completar la validación del resguardo.",
      );
      return;
    }

    notify.success(
      "Validación lista",
      `El formato del resguardo ${inventario} quedó revisado para ${titular}.`,
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <span className={styles.iconWrap}>
            <FileCheck2 size={18} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className={styles.title}>Validación y firma de recepción</h2>
            <p className={styles.description}>
              Verifica la información del resguardo antes de recabar la firma del
              titular.
            </p>
          </div>
        </div>

        {accepted && isSigned ? (
          <span className={styles.readyBadge}>
            <CheckCircle2 size={14} strokeWidth={2} />
            Listo para resguardo
          </span>
        ) : null}
      </div>

      <label className={styles.checkRow}>
        <input
          className={styles.checkbox}
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>
          Confirmo que el equipo, sus datos y accesorios corresponden con la
          entrega recibida por el titular.
        </span>
      </label>

      <div className={styles.signatureBlock}>
        <div className={styles.signatureHeader}>
          <div>
            <p className={styles.signatureLabel}>Firma del titular</p>
            <p className={styles.signatureHint}>
              Firma aquí para dejar constancia de recepción.
            </p>
          </div>

          <button
            type="button"
            className={styles.clearButton}
            onClick={clearSignature}
          >
            <Eraser size={15} strokeWidth={1.9} />
            Limpiar
          </button>
        </div>

        <div className={styles.canvasWrap} ref={containerRef}>
          {!isSigned ? (
            <div className={styles.canvasPlaceholder}>
              <PenLine size={18} strokeWidth={1.9} />
              Firma del titular
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={endDrawing}
            onPointerLeave={endDrawing}
          />
        </div>

        <div className={styles.signatureMeta}>
          <span>{titular}</span>
          <span>Inventario {inventario}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.confirmButton} onClick={confirmReception}>
          Confirmar recepción
        </button>
      </div>
    </section>
  );
}
