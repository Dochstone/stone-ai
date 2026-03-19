export default function DemoShowcase() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Что можно создать с Stone AI
        </h2>
        <p className="text-text/60 text-center mb-14 max-w-lg mx-auto">
          Картинки, видео, 3D, аудио — всё в одном чате
        </p>

        {/* Image gallery */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <span className="text-sm">🎨</span>
            </div>
            <div>
              <h3 className="font-bold text-text">AI Картинки</h3>
              <p className="text-xs text-text/40">Nano Banana Pro · GPT-5 Image · Flux</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { src: "/demo/img-cosmos.jpg", label: "Неоновый город" },
              { src: "/demo/img-portrait.jpg", label: "Космический портрет" },
              { src: "/demo/img-landscape.jpg", label: "Горный пейзаж" },
              { src: "/demo/img-fantasy.jpg", label: "Фэнтези мир" },
              { src: "/demo/img-robot.jpg", label: "3D персонаж" },
              { src: "/demo/img-food.jpg", label: "Фуд-фото" },
              { src: "/demo/img-abstract.jpg", label: "Абстракция" },
              { src: "/demo/img-architecture.jpg", label: "Архитектура" },
            ].map((img) => (
              <div key={img.label} className="group relative rounded-xl overflow-hidden aspect-square bg-bg border border-text/[0.06]">
                <img
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-8">
                  <span className="text-[11px] font-semibold text-white">{img.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <a href="/webchat?model=nano-banana-pro" className="text-sm text-accent font-semibold hover:underline">
              Попробовать генерацию →
            </a>
          </div>
        </div>

        {/* Video + 3D + Audio row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Video */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white">
            <div className="aspect-video bg-cover bg-center flex items-center justify-center relative" style={{ backgroundImage: "url(/demo/video-poster.jpg)" }}>
              <div className="w-16 h-16 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <div className="h-1 flex-1 rounded-full bg-red-400/30" />
                <span className="text-[10px] text-text/30">0:08</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🎬</span>
                <span className="text-sm font-bold text-text">AI Видео</span>
              </div>
              <p className="text-xs text-text/40 mb-2">5-10 секунд видео из текста. Kling, Runway, Pika.</p>
              <a href="/webchat?category=video" className="text-xs text-accent font-semibold hover:underline">Попробовать →</a>
            </div>
          </div>

          {/* 3D */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white">
            <div className="aspect-video bg-cover bg-center flex items-center justify-center relative" style={{ backgroundImage: "url(/demo/3d-poster.jpg)" }}>
              <div className="text-4xl drop-shadow-lg">🧊</div>
              <div className="absolute bottom-3 right-3 text-[10px] text-text/20 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>
                Вращение
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🧊</span>
                <span className="text-sm font-bold text-text">3D Модели</span>
              </div>
              <p className="text-xs text-text/40 mb-2">GLB из текста или фото. Tripo v2.5, TripoSR.</p>
              <a href="/webchat?category=3d" className="text-xs text-accent font-semibold hover:underline">Попробовать →</a>
            </div>
          </div>

          {/* Audio */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white">
            <div className="aspect-video bg-cover bg-center flex items-center justify-center relative" style={{ backgroundImage: "url(/demo/audio-poster.jpg)" }}>
              <div className="flex items-end gap-[3px] h-12 flex-1 justify-center px-6">
                {[3,5,8,4,7,9,6,4,7,5,8,3,6,9,5,7,4,8,6,3,5,7,4,6,8,5,3,7,4,9,6,5].map((h, i) => (
                  <div key={i} className="flex-1 rounded-full bg-white/40" style={{ height: `${h * 4}px` }} />
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🔊</span>
                <span className="text-sm font-bold text-text">AI Аудио</span>
              </div>
              <p className="text-xs text-text/40 mb-2">Озвучка 10+ голосами. Голосовой ввод Whisper.</p>
              <a href="/audio" className="text-xs text-accent font-semibold hover:underline">Попробовать →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
