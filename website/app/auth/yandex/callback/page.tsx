"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

export default function YandexCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      setError("No authorization code");
      return;
    }

    fetch(`${API_URL}/api/auth/yandex`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem(
            "stone_auth",
            JSON.stringify({
              token: data.token,
              email: data.user.email,
              balanceUsd: data.user.balance_usd || 0,
            })
          );
          window.location.href = "/studio";
        } else {
          setError(data.detail || "Auth failed");
        }
      })
      .catch(() => setError("Network error"));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <a href="/studio" className="text-accent hover:underline">Вернуться</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-text/50">Авторизация через Яндекс...</p>
    </div>
  );
}
