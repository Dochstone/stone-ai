export default function PromoBanner() {
  return (
    <section className="bg-accent py-5">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        <p className="text-white text-center text-lg sm:text-xl font-extrabold tracking-tight">
          🎁 15 бесплатных запросов каждый день — без привязки карты
        </p>
        <a
          href="/studio"
          className="shrink-0 bg-white text-accent px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors"
        >
          Попробовать
        </a>
      </div>
    </section>
  );
}
