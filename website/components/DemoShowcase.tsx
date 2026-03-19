"use client";

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
          {/* Video — real playable video */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white">
            <video
              src="/demo/video-1.mp4"
              muted
              loop
              playsInline
              autoPlay
              className="w-full aspect-video object-cover"
            />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🎬</span>
                <span className="text-sm font-bold text-text">AI Видео</span>
              </div>
              <p className="text-xs text-text/40 mb-2">5-10 секунд видео из текста. Kling, Runway, Pika.</p>
              <a href="/webchat?category=video" className="text-xs text-accent font-semibold hover:underline">Попробовать →</a>
            </div>
          </div>

          {/* 3D — real rotating model */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white">
            <div className="aspect-video bg-[#f0f0f0]" dangerouslySetInnerHTML={{ __html: `<model-viewer src="/demo/model-demo.glb" auto-rotate camera-controls touch-action="pan-y" style="width:100%;height:100%;background:#f0f0f0" shadow-intensity="1" exposure="1.2"></model-viewer>` }} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🧊</span>
                <span className="text-sm font-bold text-text">3D Модели</span>
              </div>
              <p className="text-xs text-text/40 mb-2">GLB из текста или фото. Tripo v2.5, TripoSR.</p>
              <a href="/webchat?category=3d" className="text-xs text-accent font-semibold hover:underline">Попробовать →</a>
            </div>
          </div>

          {/* Audio — real playable audio */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white">
            <div className="aspect-video bg-cover bg-center flex flex-col items-center justify-center relative" style={{ backgroundImage: "url(/demo/audio-poster.jpg)" }}>
              <audio id="demo-audio" src="/demo/audio-demo.mp3" preload="metadata" />
              <button
                onClick={() => { const a = document.getElementById("demo-audio") as HTMLAudioElement | null; if (a) { a.currentTime = 0; a.play(); } }}
                className="w-16 h-16 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg className="w-7 h-7 text-indigo-500 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <span className="text-[11px] text-white/80 mt-2 drop-shadow">Нажмите, чтобы прослушать</span>
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
