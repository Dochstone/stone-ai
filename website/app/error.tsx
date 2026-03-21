"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text mb-2">
          Что-то пошло не так
        </h1>
        <p className="text-text/40 text-sm mb-8">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            Попробовать снова
          </button>
          <a
            href="/"
            className="border-2 border-text/15 text-text px-6 py-3 rounded-xl font-bold text-sm hover:border-accent hover:text-accent transition-colors"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}
