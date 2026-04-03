"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/webchat";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-text mb-2">Оплата прошла!</h1>
        <p className="text-text/50 mb-8">Баланс обновлён. Спасибо за покупку.</p>
        <Link
          href="/webchat"
          className="bg-accent text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors inline-block"
        >
          Вернуться в чат
        </Link>
        <p className="text-xs text-text/30 mt-4">
          Автоматический переход через {countdown} сек.
        </p>
      </div>
    </div>
  );
}
