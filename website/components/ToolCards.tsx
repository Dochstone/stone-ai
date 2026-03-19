"use client";

import { useState, useEffect } from "react";

// All AI-generated images for cycling
const allImages = [
  "/demo/img-cosmos.jpg", "/demo/img-portrait.jpg", "/demo/img-landscape.jpg",
  "/demo/img-fantasy.jpg", "/demo/img-robot.jpg", "/demo/img-food.jpg",
  "/demo/img-abstract.jpg", "/demo/img-architecture.jpg", "/demo/img-product.jpg",
  "/demo/img-samurai.jpg", "/demo/img-underwater.jpg", "/demo/img-owl.jpg",
  "/demo/img-aurora.jpg", "/demo/img-cyberpunk.jpg", "/demo/img-temple.jpg",
  "/demo/img-droplet.jpg", "/demo/img-cabin.jpg", "/demo/img-dragon.jpg",
  "/demo/img-luxury.jpg", "/demo/img-astronaut.jpg", "/demo/img-tokyo.jpg",
  "/demo/img-sculpture.jpg", "/demo/img-tunnel.jpg", "/demo/img-tree.jpg",
];

function ImageCarousel({ images, interval = 3000, className = "" }: { images: string[]; interval?: number; className?: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [images.length, interval]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms]"
          style={{ opacity: i === idx ? 1 : 0 }}
          loading="lazy"
        />
      ))}
    </div>
  );
}

export default function ToolCards() {
  // Shuffle images for different sections
  const chatImages = allImages.slice(0, 6);
  const galleryImages = allImages;
  const searchImages = ["/demo/img-tokyo.jpg", "/demo/img-aurora.jpg", "/demo/img-luxury.jpg", "/demo/img-underwater.jpg"];
  const docImages = ["/demo/img-cabin.jpg", "/demo/img-temple.jpg", "/demo/img-sculpture.jpg"];
  const analysisImages = ["/demo/img-droplet.jpg", "/demo/img-tree.jpg", "/demo/img-owl.jpg", "/demo/img-dragon.jpg"];

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

          {/* ── AI Chat — 2 cols, cycling images ── */}
          <a href="/chat" className="sm:col-span-2 bg-[#1C1C1E] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[320px]">
            <div className="relative z-10">
              <span className="inline-block bg-accent/20 text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-4">50+ моделей</span>
              <h3 className="font-bold text-xl text-white mb-2">AI Чат</h3>
              <p className="text-white/70 text-[14px] leading-relaxed max-w-xs">GPT-5, Claude, Gemini — лучшие модели мира в одном чате</p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-[55%] opacity-60 group-hover:opacity-90 transition-opacity">
              <ImageCarousel images={chatImages} interval={3500} />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1E] via-[#1C1C1E]/50 to-transparent" />
            </div>
          </a>

          {/* ── Images — full-bleed cycling gallery ── */}
          <a href="/images" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[320px]">
            <div className="absolute inset-0">
              <ImageCarousel images={galleryImages} interval={2000} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E]/30 to-transparent" />
            </div>
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <span className="inline-block bg-pink-500/30 text-pink-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3 w-fit">24 картинки</span>
              <h3 className="font-bold text-xl text-white mb-2">Генерация картинок</h3>
              <p className="text-white/80 text-[14px]">Фотореализм, арт, фэнтези, продукт — любой стиль за секунды</p>
            </div>
          </a>

          {/* ── Search — live multi-engine search mockup ── */}
          <a href="/search" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[260px]">
            <div className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity">
              <ImageCarousel images={searchImages} interval={5000} />
            </div>
            <div className="relative z-10 p-6">
              <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">Realtime</span>
              <h3 className="font-bold text-lg text-white mb-2">AI Поиск</h3>
              <p className="text-white/60 text-[13px] mb-4">Perplexity ищет одновременно в нескольких источниках</p>
              {/* Multi-engine search mockup */}
              <div className="space-y-2">
                <div className="bg-white/[0.06] rounded-lg p-2.5 border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                    <span className="text-[11px] text-white/50">курс биткоина марта 2026</span>
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    {["Google", "Bing", "News", "Scholar"].map((e, i) => (
                      <span key={e} className={`text-[8px] px-1.5 py-0.5 rounded ${i === 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.04] text-white/20"}`}>{e}</span>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded bg-emerald-400/20 animate-pulse" />
                    <div className="h-1.5 w-4/5 rounded bg-emerald-400/15" />
                    <div className="h-1.5 w-3/5 rounded bg-white/[0.04]" />
                  </div>
                </div>
              </div>
            </div>
          </a>

          {/* ── Documents — PDF analysis mockup ── */}
          <a href="/documents" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[260px]">
            <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity">
              <ImageCarousel images={docImages} interval={6000} />
            </div>
            <div className="relative z-10 p-6">
              <span className="inline-block bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">PDF, фото</span>
              <h3 className="font-bold text-lg text-white mb-2">Анализ документов</h3>
              <p className="text-white/60 text-[13px] mb-4">AI читает документ и отвечает на вопросы</p>
              {/* Document analysis mockup */}
              <div className="bg-white/[0.06] rounded-lg p-2.5 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-amber-500/20 rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold text-amber-400">PDF</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/50">contract_2026.pdf</div>
                    <div className="text-[8px] text-white/25">127 страниц · 4.2 MB</div>
                  </div>
                  <div className="ml-auto text-[8px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Готово</div>
                </div>
                <div className="border-t border-white/[0.04] pt-2 mt-1">
                  <div className="text-[9px] text-white/30 mb-1">Ключевые риски:</div>
                  <div className="text-[9px] text-white/50">• Штраф за досрочное расторжение §12.4</div>
                  <div className="text-[9px] text-white/50">• Автопролонгация без уведомления §8.1</div>
                </div>
              </div>
            </div>
          </a>

          {/* ── Video — real autoplay video ── */}
          <a href="/video" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[220px]">
            <video src="/demo/video-demo.mp4" poster="/demo/video-poster.jpg" muted loop playsInline autoPlay className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-transparent to-transparent" />
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <span className="inline-block bg-red-500/30 text-red-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3 w-fit">5 моделей</span>
              <h3 className="font-bold text-lg text-white mb-1">AI Видео</h3>
              <p className="text-white/80 text-[13px]">Kling, Runway, Pika. Видео из текста за 5-10 секунд.</p>
            </div>
          </a>

          {/* ── Audio — animated waveform ── */}
          <a href="/audio" className="bg-gradient-to-br from-indigo-600 via-blue-700 to-violet-800 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[220px]">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">10+ голосов</span>
            <h3 className="font-bold text-lg text-white mb-2">AI Аудио</h3>
            <p className="text-white/70 text-[13px] mb-4">Озвучка текста. Голосовой ввод. Мгновенно.</p>
            <div className="flex items-end gap-[2px] h-10">
              {[3,5,8,4,7,9,6,4,7,5,8,3,6,9,5,7,4,8,6,3,5,7,4,6,8,5,3,7,4,9].map((h, i) => (
                <div key={i} className="flex-1 rounded-full bg-white/25 group-hover:bg-white/50 transition-colors" style={{ height: `${h * 3.5}px`, animation: `waveBar 1.2s ${i * 0.04}s ease-in-out infinite alternate` }} />
              ))}
            </div>
            <style>{`@keyframes waveBar { from { transform: scaleY(1); } to { transform: scaleY(0.3); } }`}</style>
          </a>

          {/* ── 3D — real rotating model ── */}
          <a href="/3d" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[220px]">
            <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: `<model-viewer src="/demo/model-demo.glb" auto-rotate camera-controls touch-action="pan-y" interaction-prompt="none" style="width:100%;height:100%;background:#1C1C1E" shadow-intensity="0.5" exposure="1.5"></model-viewer>` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 p-6 flex flex-col justify-end h-full pointer-events-none">
              <span className="inline-block bg-cyan-500/30 text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3 w-fit">Tripo + TripoSR</span>
              <h3 className="font-bold text-lg text-white mb-1">3D Модели</h3>
              <p className="text-white/60 text-[13px]">Вращайте мышью! GLB из текста или фото.</p>
            </div>
          </a>

          {/* ── Deep Analysis + reasoning — combined mockup ── */}
          <a href="/chat" className="bg-[#1C1C1E] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[260px]">
            <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity">
              <ImageCarousel images={analysisImages} interval={7000} />
            </div>
            <div className="relative z-10 p-6">
              <span className="inline-block bg-violet-500/20 text-violet-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">o3 + R1</span>
              <h3 className="font-bold text-lg text-white mb-2">Глубокий анализ</h3>
              <p className="text-white/60 text-[13px] mb-4">AI рассуждает пошагово, показывая ход мыслей</p>
              {/* Reasoning chain mockup */}
              <div className="bg-white/[0.06] rounded-lg p-3 border border-white/[0.06] space-y-2.5">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center shrink-0 mt-0.5"><span className="text-[8px] text-violet-300 font-bold">1</span></div>
                  <div><div className="text-[9px] text-white/30">Разбор задачи</div><div className="text-[10px] text-white/60">Определяю ключевые переменные и ограничения...</div></div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center shrink-0 mt-0.5"><span className="text-[8px] text-violet-300 font-bold">2</span></div>
                  <div><div className="text-[9px] text-white/30">Гипотезы</div><div className="text-[10px] text-white/60">Рассматриваю 3 подхода: аналитический, численный, графический</div></div>
                </div>
                <div className="flex items-start gap-2 opacity-40">
                  <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse"><span className="text-[8px] text-white/30 font-bold">3</span></div>
                  <div><div className="text-[9px] text-white/20">Решение</div><div className="text-[10px] text-white/30">Формулирую финальный ответ...</div></div>
                </div>
              </div>
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

        </div>
      </div>
    </section>
  );
}
