export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center font-[family-name:var(--font-manrope)]">
        <h1 className="text-[120px] md:text-[160px] font-extrabold leading-none text-accent/20 select-none">
          404
        </h1>
        <p className="text-xl md:text-2xl font-bold text-text mt-2 mb-2">
          Страница не найдена
        </p>
        <p className="text-text/40 text-sm mb-8">
          Возможно, она была удалена или вы перешли по неверной ссылке.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="/"
            className="inline-block bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            На главную
          </a>
          <a
            href="/webchat"
            className="inline-block border border-accent text-accent px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/5 transition-colors"
          >
            Открыть чат
          </a>
        </div>
      </div>
    </div>
  );
}
