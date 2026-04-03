"use client";

import Link from "next/link";

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-text mb-2">Оплата не прошла</h1>
        <p className="text-text/50 mb-8">Платёж был отменён или произошла ошибка. Средства не списаны.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pricing"
            className="bg-accent text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            Попробовать снова
          </Link>
          <Link
            href="/webchat"
            className="border border-text/10 text-text/60 px-8 py-3 rounded-xl font-medium text-sm hover:bg-text/[0.04] transition-colors"
          >
            Вернуться в чат
          </Link>
        </div>
      </div>
    </div>
  );
}
