"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const YANDEX_CLIENT_ID = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID || "";

export interface AuthState {
  token: string;
  email: string;
  balanceUsd: number;
}

function handleAuthResponse(data: any, onAuth: (a: AuthState) => void) {
  const auth: AuthState = {
    token: data.token,
    email: data.user.email,
    balanceUsd: data.user.balance_usd || 0,
  };
  localStorage.setItem("stone_auth", JSON.stringify(auth));
  onAuth(auth);
}

export default function AuthForm({ onAuth, subtitle }: { onAuth: (auth: AuthState) => void; subtitle?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Ошибка"); return; }
      handleAuthResponse(data, onAuth);
    } catch { setError("Ошибка сети"); } finally { setLoading(false); }
  };

  const googleLogin = () => {
    if (!GOOGLE_CLIENT_ID) { setError("Google auth не настроен"); return; }
    // Load Google Identity Services
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/google/callback")}&response_type=code&scope=email%20profile&prompt=select_account`;
    window.location.href = url;
  };

  const yandexLogin = () => {
    if (!YANDEX_CLIENT_ID) { setError("Яндекс auth не настроен"); return; }
    const url = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/yandex/callback")}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-extrabold text-text">Stone AI</a>
          <p className="mt-2 text-text/50 text-sm">{subtitle || "50+ AI-моделей в одном чате"}</p>
        </div>

        <div className="bg-white rounded-2xl border border-text/5 p-8">
          {/* OAuth buttons */}
          <div className="space-y-2.5 mb-6">
            <button
              onClick={googleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-text/10 py-3 rounded-xl font-semibold text-sm hover:border-text/20 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Войти через Google
            </button>

            <button
              onClick={yandexLogin}
              className="w-full flex items-center justify-center gap-3 bg-[#FC3F1D] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#e53517] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.63 21.67h2.45V2.33h-3.46c-4.07 0-6.2 2.14-6.2 5.27 0 2.63 1.07 4.14 3.33 5.67l-3.65 8.4h2.6l3.94-9.14-.94-.63c-1.81-1.2-2.63-2.28-2.63-4.2 0-2.07 1.35-3.47 3.63-3.47h.93v17.37z" />
              </svg>
              Войти через Яндекс
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-text/10" />
            <span className="text-xs text-text/30 font-medium">или</span>
            <div className="flex-1 h-px bg-text/10" />
          </div>

          {/* Email/Password tabs */}
          <div className="flex gap-1 bg-bg rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "login" ? "bg-white text-text shadow-sm" : "text-text/40"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "register" ? "bg-white text-text shadow-sm" : "text-text/40"
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder={mode === "register" ? "Пароль (мин. 8 символов)" : "Пароль"}
            />

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-text/30">
          Или используйте <a href="https://t.me/StoneAIBot" className="text-accent hover:underline">Telegram-бота</a>
        </p>
      </div>
    </div>
  );
}
