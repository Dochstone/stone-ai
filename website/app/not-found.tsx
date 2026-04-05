import Stone from "@/components/Stone";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center font-[family-name:var(--font-manrope)]">
        <Stone variant="error" size={120} className="mx-auto mb-6" />
        <h1 className="text-6xl md:text-7xl font-extrabold leading-none text-accent/30 select-none mb-2">
          404
        </h1>
        <p className="text-xl md:text-2xl font-bold text-text mb-2">
          Страница не найдена
        </p>
        <p className="text-text/40 text-sm mb-8">
          Возможно, она была удалена или вы перешли по неверной ссылке.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="/" className="inline-block bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
            На главную
          </a>
          <a href="/dashboard/chat" className="inline-block border border-accent text-accent px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/5 transition-colors">
            Открыть чат
          </a>
        </div>
      </div>
    </div>
  );
}
