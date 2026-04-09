"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TelegramCallbackInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const balance = searchParams.get("balance");

    if (token) {
      const auth = {
        token,
        email: email || name || "Telegram",
        balanceUsd: parseFloat(balance || "0"),
      };
      localStorage.setItem("stone_auth", JSON.stringify(auth));
      // Clean up TG session
      try { sessionStorage.removeItem("stone_tg_session"); } catch {}
      // Redirect to chat
      window.location.href = "/dashboard/chat";
    } else {
      window.location.href = "/profile";
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-text/50">Входим в аккаунт...</p>
      </div>
    </div>
  );
}

export default function TelegramCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg"><div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <TelegramCallbackInner />
    </Suspense>
  );
}
