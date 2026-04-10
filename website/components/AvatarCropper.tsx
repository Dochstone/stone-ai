"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";

interface AvatarCropperProps {
  imageSrc: string;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function AvatarCropper({ imageSrc, onSave, onCancel }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const offsetX = useRef(0);
  const offsetY = useRef(0);
  const scale = useRef(1);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const CANVAS_SIZE = 320;
  const CIRCLE_RADIUS = 140;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const w = img.naturalWidth * scale.current;
    const h = img.naturalHeight * scale.current;
    ctx.drawImage(img, offsetX.current, offsetY.current, w, h);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, []);

  const clampOffset = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const w = img.naturalWidth * scale.current;
    const h = img.naturalHeight * scale.current;
    const minX = CANVAS_SIZE - w;
    const minY = CANVAS_SIZE - h;
    offsetX.current = Math.min(0, Math.max(minX, offsetX.current));
    offsetY.current = Math.min(0, Math.max(minY, offsetY.current));
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const fitScale = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      scale.current = fitScale;
      offsetX.current = (CANVAS_SIZE - img.naturalWidth * fitScale) / 2;
      offsetY.current = (CANVAS_SIZE - img.naturalHeight * fitScale) / 2;
      setZoom(1);
      draw();
    };
    img.src = imageSrc;
  }, [imageSrc, draw]);

  const handleZoom = useCallback((newZoom: number) => {
    const img = imageRef.current;
    if (!img) return;
    const baseScale = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
    const prevScale = scale.current;
    const nextScale = baseScale * newZoom;
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    offsetX.current = cx - (cx - offsetX.current) * (nextScale / prevScale);
    offsetY.current = cy - (cy - offsetY.current) * (nextScale / prevScale);
    scale.current = nextScale;
    setZoom(newZoom);
    clampOffset();
    draw();
  }, [clampOffset, draw]);

  const getPointer = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ("touches" in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ("clientX" in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  };

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    lastPointer.current = getPointer(e);
  }, []);

  const onPointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const p = getPointer(e);
    offsetX.current += p.x - lastPointer.current.x;
    offsetY.current += p.y - lastPointer.current.y;
    lastPointer.current = p;
    clampOffset();
    draw();
  }, [clampOffset, draw]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.min(3, Math.max(1, zoom + delta));
    handleZoom(newZoom);
  }, [zoom, handleZoom]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("mousemove", onPointerMove as EventListener);
    el.addEventListener("mouseup", onPointerUp);
    el.addEventListener("mouseleave", onPointerUp);
    el.addEventListener("touchmove", onPointerMove as EventListener, { passive: false });
    el.addEventListener("touchend", onPointerUp);
    return () => {
      el.removeEventListener("mousemove", onPointerMove as EventListener);
      el.removeEventListener("mouseup", onPointerUp);
      el.removeEventListener("mouseleave", onPointerUp);
      el.removeEventListener("touchmove", onPointerMove as EventListener);
      el.removeEventListener("touchend", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const handleSave = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    setIsLoading(true);
    const output = document.createElement("canvas");
    output.width = 256;
    output.height = 256;
    const ctx = output.getContext("2d");
    if (!ctx) return;
    const srcX = (CANVAS_SIZE / 2 - CIRCLE_RADIUS - offsetX.current) / scale.current;
    const srcY = (CANVAS_SIZE / 2 - CIRCLE_RADIUS - offsetY.current) / scale.current;
    const srcSize = (CIRCLE_RADIUS * 2) / scale.current;
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 256, 256);
    const dataUrl = output.toDataURL("image/webp", 0.85);
    onSave(dataUrl);
  }, [onSave]);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl p-6 bg-bg border border-text/10">
        <h2 className="text-lg font-semibold text-text">Выберите область</h2>
        <div ref={containerRef} style={{ position: "relative", width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 12, overflow: "hidden" }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ display: "block", cursor: "grab", touchAction: "none" }}
            onMouseDown={onPointerDown}
            onTouchStart={onPointerDown}
            onWheel={onWheel}
          />
        </div>
        <div className="flex items-center gap-3 w-full">
          <span className="text-text/50 text-xs">−</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="text-text/50 text-xs">+</span>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-text/10 text-text/60 hover:bg-text/[0.04] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
