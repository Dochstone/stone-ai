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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Image demo */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white group">
            <div className="aspect-square bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300/40 via-purple-300/30 to-blue-400/40" />
              <div className="relative text-center">
                <div className="text-5xl mb-2">🎨</div>
                <p className="text-sm font-semibold text-text/50">Nano Banana Pro</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-text mb-1">AI Картинки</p>
              <p className="text-[11px] text-text/40">Фотореалистичные 4K изображения из текста</p>
              <a href="/webchat?model=nano-banana-pro" className="text-[11px] text-accent font-semibold mt-2 block hover:underline">Попробовать →</a>
            </div>
          </div>

          {/* Video demo */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white group">
            <div className="aspect-square bg-gradient-to-br from-red-100 via-rose-100 to-orange-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-300/30 via-rose-300/20 to-orange-300/30" />
              <div className="relative text-center">
                <div className="text-5xl mb-2">🎬</div>
                <p className="text-sm font-semibold text-text/50">Kling v2</p>
              </div>
              {/* Fake play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-accent ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-text mb-1">AI Видео</p>
              <p className="text-[11px] text-text/40">5-10 секунд видео из текста и фото</p>
              <a href="/webchat?category=video" className="text-[11px] text-accent font-semibold mt-2 block hover:underline">Попробовать →</a>
            </div>
          </div>

          {/* 3D demo */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white group">
            <div className="aspect-square bg-gradient-to-br from-cyan-100 via-teal-50 to-emerald-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/30 via-teal-200/20 to-emerald-300/30" />
              <div className="relative text-center">
                <div className="text-5xl mb-2">🧊</div>
                <p className="text-sm font-semibold text-text/50">Tripo v2.5</p>
              </div>
              {/* Rotation indicator */}
              <div className="absolute bottom-3 right-3 text-text/15">
                <svg className="w-8 h-8 animate-spin" style={{ animationDuration: "8s" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                </svg>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-text mb-1">AI 3D модели</p>
              <p className="text-[11px] text-text/40">GLB модели из текста или фотографии</p>
              <a href="/webchat?category=3d" className="text-[11px] text-accent font-semibold mt-2 block hover:underline">Попробовать →</a>
            </div>
          </div>

          {/* Audio demo */}
          <div className="rounded-2xl overflow-hidden border border-text/[0.06] bg-white group">
            <div className="aspect-square bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-300/30 via-emerald-200/20 to-teal-300/30" />
              <div className="relative text-center">
                <div className="text-5xl mb-2">🔊</div>
                <p className="text-sm font-semibold text-text/50">GPT Audio</p>
              </div>
              {/* Sound wave */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end gap-1 h-8 justify-center">
                {[3, 5, 8, 6, 9, 4, 7, 5, 3, 6, 8, 4, 7, 5, 3].map((h, i) => (
                  <div key={i} className="w-1 bg-teal/20 rounded-full" style={{ height: `${h * 3}px` }} />
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold text-text mb-1">AI Аудио</p>
              <p className="text-[11px] text-text/40">Озвучка 10+ голосами, голосовой ввод</p>
              <a href="/audio" className="text-[11px] text-accent font-semibold mt-2 block hover:underline">Попробовать →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
