"use client";

import { useState, useEffect } from "react";

const chatImages = ["/demo/img-cosmos.jpg", "/demo/img-portrait.jpg", "/demo/img-landscape.jpg", "/demo/img-fantasy.jpg"];
const galleryImages = [
  "/demo/img-cosmos.jpg", "/demo/img-portrait.jpg", "/demo/img-landscape.jpg",
  "/demo/img-fantasy.jpg", "/demo/img-robot.jpg", "/demo/img-food.jpg",
  "/demo/img-abstract.jpg", "/demo/img-architecture.jpg", "/demo/img-product.jpg",
];

function ImageCarousel({ images, interval = 3000 }: { images: string[]; interval?: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [images.length, interval]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === idx ? 1 : 0 }}
          loading="lazy"
        />
      ))}
    </div>
  );
}

export default function ToolCards() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Полный арсенал AI инструментов для любой задачи
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">
          Все инструменты AI в одном месте
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

          {/* ── AI Chat — 2 cols, with rotating preview images ── */}
          <a href="/chat" className="sm:col-span-2 bg-[#1C1C1E] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[320px]">
            <div className="relative z-10">
              <span className="inline-block bg-accent/20 text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-4">50+ моделей</span>
              <h3 className="font-bold text-xl text-white mb-2">AI Чат</h3>
              <p className="text-white/70 text-[14px] leading-relaxed max-w-xs">GPT-5, Claude, Gemini — лучшие модели мира в одном чате</p>
            </div>
            {/* Rotating AI-generated images */}
            <div className="absolute right-4 sm:right-6 top-4 bottom-4 w-[200px] sm:w-[260px] rounded-xl overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
              <ImageCarousel images={chatImages} interval={4000} />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#1C1C1E]" />
            </div>
          </a>

          {/* ── Images — auto-cycling gallery ── */}
          <a href="/images" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[320px]">
            {/* Full-bleed rotating image */}
            <div className="absolute inset-0">
              <ImageCarousel images={galleryImages} interval={2500} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/40 to-transparent" />
            </div>
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <span className="inline-block bg-pink-500/20 text-pink-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3 w-fit">6 генераторов</span>
              <h3 className="font-bold text-xl text-white mb-2">Генерация картинок</h3>
              <p className="text-white/80 text-[14px] leading-relaxed">Nano Banana Pro, GPT-5 Image, Flux. Фотореализм 4K.</p>
            </div>
          </a>

          {/* ── Documents — PDF mockup ── */}
          <a href="/documents" className="bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">PDF, фото</span>
            <h3 className="font-bold text-lg text-white mb-2">Анализ документов</h3>
            <p className="text-white/80 text-[14px] leading-relaxed">Загрузите PDF или фото — AI ответит на любой вопрос.</p>
            <div className="absolute bottom-4 right-4 w-20 h-24 bg-white/15 rounded-lg border border-white/20 flex flex-col items-center justify-center gap-1 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <span className="text-[8px] text-white/40 font-bold">PDF</span>
            </div>
          </a>

          {/* ── Search — live search mockup ── */}
          <a href="/search" className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">Realtime</span>
            <h3 className="font-bold text-lg text-white mb-2">AI Поиск</h3>
            <p className="text-white/80 text-[14px] leading-relaxed">Perplexity ищет в интернете. Актуальные данные, не кэш.</p>
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-60 transition-opacity">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            </div>
          </a>

          {/* ── Video — real autoplay video ── */}
          <a href="/video" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[180px]">
            <video
              src="/demo/video-demo.mp4"
              poster="/demo/video-poster.jpg"
              muted loop playsInline autoPlay
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-transparent to-transparent" />
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <span className="inline-block bg-red-500/30 text-red-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3 w-fit">5 моделей</span>
              <h3 className="font-bold text-lg text-white mb-1">AI Видео</h3>
              <p className="text-white/80 text-[14px] leading-relaxed">Kling, Runway, Pika. Видео из текста за 5-10 секунд.</p>
            </div>
          </a>

          {/* ── Audio — playable waveform ── */}
          <a href="/audio" className="bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-800 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">10+ голосов</span>
            <h3 className="font-bold text-lg text-white mb-2">AI Аудио</h3>
            <p className="text-white/80 text-[14px] leading-relaxed mb-4">Озвучка текста. Голосовой ввод. Мгновенно.</p>
            {/* Animated waveform */}
            <div className="flex items-end gap-[2px] h-8">
              {[3,5,8,4,7,9,6,4,7,5,8,3,6,9,5,7,4,8,6,3,5,7,4,6,8,5,3,7,4,9].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-white/30 group-hover:bg-white/50 transition-colors"
                  style={{
                    height: `${h * 3}px`,
                    animation: `waveBar 1.5s ${i * 0.05}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
            <style>{`@keyframes waveBar { from { transform: scaleY(1); } to { transform: scaleY(0.4); } }`}</style>
          </a>

          {/* ── 3D — real rotating model ── */}
          <a href="/3d" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[180px]">
            <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: `<model-viewer src="/demo/model-demo.glb" auto-rotate camera-controls touch-action="pan-y" interaction-prompt="none" style="width:100%;height:100%;background:#1C1C1E" shadow-intensity="0.5" exposure="1.5"></model-viewer>` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 p-6 flex flex-col justify-end h-full pointer-events-none">
              <span className="inline-block bg-cyan-500/30 text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3 w-fit">Tripo + TripoSR</span>
              <h3 className="font-bold text-lg text-white mb-1">3D Модели</h3>
              <p className="text-white/70 text-[14px] leading-relaxed">GLB из текста или фото. Вращайте мышью!</p>
            </div>
          </a>

          {/* ── API — code snippet ── */}
          <a href="/docs" className="bg-gradient-to-br from-slate-600 via-slate-700 to-zinc-900 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden min-h-[180px]">
            <span className="inline-block bg-sky-400/20 text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">API</span>
            <h3 className="font-bold text-lg text-white mb-3">Простой API</h3>
            <div className="bg-white/[0.04] rounded-xl p-3 overflow-x-auto border border-white/[0.06]">
              <pre className="text-[11px] leading-[1.7] font-mono" dangerouslySetInnerHTML={{ __html: `<span style="color:#34d399">curl</span><span style="color:rgba(255,255,255,0.5)"> -X </span><span style="color:#fcd34d">POST</span><span style="color:rgba(255,255,255,0.5)"> /api/chat \\
  -H </span><span style="color:#7dd3fc">"Bearer $TKN"</span><span style="color:rgba(255,255,255,0.5)"> \\
  -d </span><span style="color:#7dd3fc">'{"model_id"</span><span style="color:rgba(255,255,255,0.5)">:</span><span style="color:#fcd34d">"gpt-4o-mini"</span><span style="color:rgba(255,255,255,0.5)">,
      </span><span style="color:#7dd3fc">"messages"</span><span style="color:rgba(255,255,255,0.5)">:[...]}'</span>` }} />
            </div>
          </a>

          {/* ── Deep Analysis — reasoning steps ── */}
          <a href="/chat" className="bg-gradient-to-br from-cyan-600 via-blue-700 to-slate-800 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[180px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">o3 + R1</span>
            <h3 className="font-bold text-lg text-white mb-2">Глубокий анализ</h3>
            <p className="text-white/70 text-[14px] leading-relaxed mb-4">Пошаговое рассуждение для сложных задач.</p>
            <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-2">
              {["Анализирую условие...", "Рассматриваю подходы...", "Формулирую ответ..."].map((text, i) => (
                <div key={i} className="flex items-center gap-2" style={{ opacity: i < 2 ? 1 : 0.4 }}>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-white/40 flex items-center justify-center ${i < 2 ? "" : ""}`}>
                    {i < 2 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-[10px] text-white/60">{text}</span>
                </div>
              ))}
            </div>
          </a>

        </div>
      </div>
    </section>
  );
}
