"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  imageUrl: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
}

const OUTPUT_SIZE = 256;

export default function AvatarCropper({ imageUrl, onCrop, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const CIRCLE_SIZE = 240;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const minScale = CIRCLE_SIZE / Math.min(img.width, img.height);
      setScale(Math.max(minScale, 1));
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const imgW = img.width * scale;
    const imgH = img.height * scale;
    const x = (w - imgW) / 2 + offset.x;
    const y = (h - imgH) / 2 + offset.y;
    ctx.drawImage(img, x, y, imgW, imgH);

    // Darken outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, CIRCLE_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, CIRCLE_SIZE / 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [scale, offset]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => {
      const next = { x: prev.x + dx, y: prev.y + dy };
      requestAnimationFrame(draw);
      return next;
    });
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const minScale = CIRCLE_SIZE / Math.min(img.width, img.height);
    setScale((prev) => {
      const next = Math.max(minScale, Math.min(5, prev - e.deltaY * 0.001));
      requestAnimationFrame(draw);
      return next;
    });
  };

  const handleCrop = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const out = document.createElement("canvas");
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext("2d")!;

    const w = canvas.width;
    const h = canvas.height;
    const imgW = img.width * scale;
    const imgH = img.height * scale;
    const imgX = (w - imgW) / 2 + offset.x;
    const imgY = (h - imgH) / 2 + offset.y;

    const circleX = w / 2 - CIRCLE_SIZE / 2;
    const circleY = h / 2 - CIRCLE_SIZE / 2;

    const srcX = (circleX - imgX) / scale;
    const srcY = (circleY - imgY) / scale;
    const srcSize = CIRCLE_SIZE / scale;

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    onCrop(out.toDataURL("image/webp", 0.85));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg rounded-2xl border border-text/10 shadow-xl max-w-sm w-full overflow-hidden">
        <div className="p-4 border-b border-text/[0.06]">
          <h3 className="text-sm font-bold text-text text-center">Выберите область</h3>
          <p className="text-[11px] text-text/40 text-center mt-0.5">Перетащите и масштабируйте</p>
        </div>

        <div ref={containerRef} className="relative flex items-center justify-center" style={{ height: 300 }}>
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 pb-2 flex items-center gap-3">
          <svg className="w-4 h-4 text-text/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
          </svg>
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => {
              setScale(parseFloat(e.target.value));
              requestAnimationFrame(draw);
            }}
            className="flex-1 accent-accent h-1"
          />
          <svg className="w-4 h-4 text-text/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
          </svg>
        </div>

        <div className="flex gap-3 p-4 border-t border-text/[0.06]">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-text/10 text-text/60 hover:bg-text/[0.04] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
