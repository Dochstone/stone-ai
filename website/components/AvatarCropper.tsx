"use client";

import { useRef, useEffect, useState } from "react";

interface Props {
  imageUrl: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
}

const OUTPUT_SIZE = 256;
const CANVAS_SIZE = 300;
const CIRCLE_SIZE = 240;

export default function AvatarCropper({ imageUrl, onCrop, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [sliderVal, setSliderVal] = useState(1);
  const [ready, setReady] = useState(false);

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    const s = scaleRef.current;
    const off = offsetRef.current;

    ctx.clearRect(0, 0, w, h);

    const imgW = img.width * s;
    const imgH = img.height * s;
    const x = (w - imgW) / 2 + off.x;
    const y = (h - imgH) / 2 + off.y;
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
  };

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const minScale = CIRCLE_SIZE / Math.min(img.width, img.height);
      scaleRef.current = Math.max(minScale, 0.5);
      setSliderVal(scaleRef.current);
      offsetRef.current = { x: 0, y: 0 };
      setReady(true);
      draw();
    };
    img.src = imageUrl;
  }, [imageUrl]);

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
    offsetRef.current = { x: offsetRef.current.x + dx, y: offsetRef.current.y + dy };
    draw();
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const minScale = CIRCLE_SIZE / Math.min(img.width, img.height);
    scaleRef.current = Math.max(minScale, Math.min(5, scaleRef.current - e.deltaY * 0.001));
    setSliderVal(scaleRef.current);
    draw();
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const s = scaleRef.current;
    const off = offsetRef.current;

    const out = document.createElement("canvas");
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext("2d")!;

    const imgW = img.width * s;
    const imgH = img.height * s;
    const imgX = (CANVAS_SIZE - imgW) / 2 + off.x;
    const imgY = (CANVAS_SIZE - imgH) / 2 + off.y;

    const circleX = CANVAS_SIZE / 2 - CIRCLE_SIZE / 2;
    const circleY = CANVAS_SIZE / 2 - CIRCLE_SIZE / 2;

    const srcX = (circleX - imgX) / s;
    const srcY = (circleY - imgY) / s;
    const srcSize = CIRCLE_SIZE / s;

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

        <div className="relative flex items-center justify-center" style={{ height: CANVAS_SIZE }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
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
            min={0.1}
            max={4}
            step={0.01}
            value={sliderVal}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              scaleRef.current = v;
              setSliderVal(v);
              draw();
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
            disabled={!ready}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
