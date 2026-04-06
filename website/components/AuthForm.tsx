"use client";

import { useState, useEffect, useCallback } from "react";

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

type Screen = "login" | "register" | "verify" | "forgot" | "reset";

export default function AuthForm({ onAuth, subtitle }: { onAuth: (auth: AuthState) => void; subtitle?: string }) {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [tgSessionId, setTgSessionId] = useState("");
  const [tgPolling, setTgPolling] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Poll for Telegram login confirmation
  useEffect(() => {
    if (!tgPolling || !tgSessionId) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const res = await fetch(`${API_URL}/api/auth/telegram-web-check?session=${tgSessionId}`);
          const data = await res.json();
          if (data.status === "ok" && data.token) {
            handleAuthResponse(data, onAuth);
            setTgPolling(false);
            return;
          }
          if (data.status !== "pending") {
            setTgPolling(false);
            return;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 2000));
      }
    };
    poll();
    // Stop polling after 5 minutes
    const timeout = setTimeout(() => { cancelled = true; setTgPolling(false); }, 300000);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [tgPolling, tgSessionId, onAuth]);

  const telegramLogin = async () => {
    setError("");
    // Open window synchronously (before await) to avoid popup blocker
    const tgWindow = window.open("about:blank", "_blank");
    try {
      const res = await fetch(`${API_URL}/api/auth/telegram-web-start`, { method: "POST" });
      const data = await res.json();
      const sid = data.session_id;
      setTgSessionId(sid);
      setTgPolling(true);
      const tgUrl = `https://t.me/drifttt55bot?start=web_${sid}`;
      if (tgWindow) {
        tgWindow.location.href = tgUrl;
      } else {
        // Fallback if popup was still blocked
        window.location.href = tgUrl;
      }
    } catch {
      if (tgWindow) tgWindow.close();
      setError("Не удалось начать авторизацию через Telegram");
    }
  };

  const resendCode = useCallback(async () => {
    if (resendTimer > 0) return;
    setError("");
    try {
      if (screen === "verify") {
        await api("/api/auth/register", { email, password });
      } else if (screen === "reset") {
        await api("/api/auth/forgot-password", { email });
      }
      setResendTimer(60);
      setMessage("Новый код отправлен на " + email);
    } catch (err: any) { setError(err.message); }
  }, [screen, email, password, resendTimer]);

  const api = async (endpoint: string, body: object) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Ошибка");
    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await api("/api/auth/login", { email, password });
      handleAuthResponse(data, onAuth);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api("/api/auth/register", { email, password });
      setMessage("Код отправлен на " + email);
      setResendTimer(60);
      setScreen("verify");
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await api("/api/auth/verify-email", { email, code });
      handleAuthResponse(data, onAuth);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api("/api/auth/forgot-password", { email });
      setMessage("Код отправлен на " + email);
      setResendTimer(60);
      setScreen("reset");
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await api("/api/auth/reset-password", { email, code, new_password: newPassword });
      handleAuthResponse(data, onAuth);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const googleLogin = () => {
    if (!GOOGLE_CLIENT_ID) { setError("Google auth не настроен"); return; }
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/google/callback")}&response_type=code&scope=email%20profile&prompt=select_account`;
    window.location.href = url;
  };

  const yandexLogin = () => {
    if (!YANDEX_CLIENT_ID) { setError("Яндекс auth не настроен"); return; }
    const url = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/yandex/callback")}`;
    window.location.href = url;
  };

  const inputClass = "w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent";
  const btnClass = "w-full bg-accent text-white py-3 min-h-[44px] rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50";

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 pt-24 pb-12">
      <div className="w-full max-w-[860px] bg-white rounded-2xl border border-text/5 shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left — hero image */}
          <div className="hidden md:block md:w-[340px] shrink-0 relative">
            <img src="/onboard-hero.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="inline-flex items-center gap-1.5 bg-accent/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full mb-3">
                🎁 +100₽ на баланс
              </div>
              <h2 className="text-white text-xl font-extrabold leading-tight mb-1">65+ нейросетей</h2>
              <p className="text-white/50 text-xs leading-relaxed">GPT-5 · Claude · Gemini · DeepSeek · Llama · Mistral</p>
              <div className="flex gap-3 mt-3">
                {[
                  { icon: "⚡", text: "15 запросов/день" },
                  { icon: "🎨", text: "Картинки" },
                  { icon: "💾", text: "История" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-white/60 text-[10px]">
                    <span>{b.icon}</span><span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — auth form */}
          <div className="flex-1 min-w-0">
            {/* Mobile header */}
            <div className="md:hidden bg-gradient-to-r from-accent to-accent/80 px-6 py-5 text-center">
              <h2 className="text-lg font-extrabold text-white">{subtitle || "65+ нейросетей в одном окне"}</h2>
              <p className="text-white/70 text-xs mt-1">Регистрация за 10 секунд — <b className="text-white">100₽ бонус</b></p>
            </div>

            <div className="p-6 md:p-8">

          {/* Verify Email Screen */}
          {screen === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg">Проверьте почту</h3>
                <p className="text-text/50 text-sm mt-1">{message}</p>
                <p className="text-text/30 text-xs mt-2">Не нашли? Проверьте папку «Спам»</p>
              </div>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="Введите 6-значный код" required maxLength={6}
                className={`${inputClass} text-center text-lg tracking-[0.3em] font-bold`} autoFocus />
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Проверяю..." : "Подтвердить"}
              </button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => { setScreen("register"); setError(""); setCode(""); }}
                  className="text-text/40 text-xs hover:text-accent transition-colors py-1">
                  Назад
                </button>
                <button type="button" onClick={resendCode} disabled={resendTimer > 0}
                  className="text-xs hover:text-accent transition-colors py-1 disabled:text-text/20 text-text/40">
                  {resendTimer > 0 ? `Повторить через ${resendTimer}с` : "Отправить код повторно"}
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Screen */}
          {screen === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">Забыли пароль?</h3>
                <p className="text-text/50 text-sm mt-1">Введите email — мы отправим код для сброса</p>
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email" required className={inputClass} autoFocus />
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Отправляю..." : "Отправить код"}
              </button>
              <button type="button" onClick={() => { setScreen("login"); setError(""); }}
                className="w-full text-text/40 text-xs hover:text-accent transition-colors py-1">
                Назад ко входу
              </button>
            </form>
          )}

          {/* Reset Password Screen */}
          {screen === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">Новый пароль</h3>
                <p className="text-text/50 text-sm mt-1">{message}</p>
                <p className="text-text/30 text-xs mt-2">Не нашли письмо? Проверьте папку «Спам»</p>
              </div>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="Код из письма" required maxLength={6}
                className={`${inputClass} text-center text-lg tracking-[0.3em] font-bold`} autoFocus />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Новый пароль (мин. 8 символов)" required minLength={8} className={inputClass} />
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Сохраняю..." : "Сменить пароль"}
              </button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => { setScreen("forgot"); setError(""); setCode(""); }}
                  className="text-text/40 text-xs hover:text-accent transition-colors py-1">
                Назад
                </button>
                <button type="button" onClick={resendCode} disabled={resendTimer > 0}
                  className="text-xs hover:text-accent transition-colors py-1 disabled:text-text/20 text-text/40">
                  {resendTimer > 0 ? `Повторить через ${resendTimer}с` : "Отправить код повторно"}
                </button>
              </div>
            </form>
          )}

          {/* Login / Register Screens */}
          {(screen === "login" || screen === "register") && (
            <>
              {/* OAuth buttons */}
              <div className="space-y-2.5 mb-6">
                <button onClick={googleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-text/10 py-3 rounded-xl font-semibold text-sm hover:border-text/20 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Войти через Google
                </button>
                <button onClick={yandexLogin}
                  className="w-full flex items-center justify-center gap-3 bg-[#FC3F1D] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#e53517] transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.63 21.67h2.45V2.33h-3.46c-4.07 0-6.2 2.14-6.2 5.27 0 2.63 1.07 4.14 3.33 5.67l-3.65 8.4h2.6l3.94-9.14-.94-.63c-1.81-1.2-2.63-2.28-2.63-4.2 0-2.07 1.35-3.47 3.63-3.47h.93v17.37z" />
                  </svg>
                  Войти через Яндекс
                </button>
                <button onClick={telegramLogin} disabled={tgPolling}
                  className="w-full flex items-center justify-center gap-3 bg-[#2AABEE] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#229ED9] transition-colors disabled:opacity-70">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  {tgPolling ? "Ожидание подтверждения..." : "Войти через Telegram"}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-text/10" />
                <span className="text-xs text-text/30 font-medium">или</span>
                <div className="flex-1 h-px bg-text/10" />
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-bg rounded-xl p-1 mb-5">
                <button onClick={() => { setScreen("login"); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${screen === "login" ? "bg-white text-text shadow-sm" : "text-text/40"}`}>
                  Вход
                </button>
                <button onClick={() => { setScreen("register"); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${screen === "register" ? "bg-white text-text shadow-sm" : "text-text/40"}`}>
                  Регистрация
                </button>
              </div>

              <form onSubmit={screen === "login" ? handleLogin : handleRegister} className="space-y-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email" required autoComplete="email" className={inputClass} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={screen === "register" ? "Пароль (мин. 8 символов)" : "Пароль"}
                  required minLength={8}
                  autoComplete={screen === "register" ? "new-password" : "current-password"}
                  className={inputClass} />

                {screen === "register" && password.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= i * 3
                            ? password.length >= 12 ? "bg-emerald-400" : password.length >= 8 ? "bg-amber-400" : "bg-red-400"
                            : "bg-text/10"
                        }`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-text/40">
                      {password.length < 8 ? "Слабый" : password.length < 12 ? "Средний" : "Сильный"}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5" role="alert">
                    <p className="text-red-600 dark:text-red-400 text-xs font-medium">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? "Загрузка..." : screen === "login" ? "Войти" : "Получить код на почту"}
                </button>

                {screen === "login" && (
                  <button type="button" onClick={() => { setScreen("forgot"); setError(""); }}
                    className="w-full text-text/40 text-xs hover:text-accent transition-colors py-1">
                    Забыли пароль?
                  </button>
                )}
              </form>
            </>
          )}
        </div>

        {tgPolling && (
          <div className="text-center mt-4 bg-[#2AABEE]/10 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-[#2AABEE]">Подтвердите вход в Telegram</p>
            <p className="text-xs text-text/40 mt-1">
              1. Откройте Telegram<br/>
              2. Нажмите Start в боте<br/>
              3. Страница обновится автоматически
            </p>
            <button
              onClick={() => {
                const w = window.open("about:blank", "_blank");
                if (w) w.location.href = `https://t.me/drifttt55bot?start=web_${tgSessionId}`;
                else window.location.href = `https://t.me/drifttt55bot?start=web_${tgSessionId}`;
              }}
              className="mt-2 text-xs text-[#2AABEE] hover:underline"
            >
              Открыть бота повторно
            </button>
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
