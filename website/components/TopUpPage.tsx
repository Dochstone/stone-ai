"use client";

import { useState, useEffect, useCallback } from "react";
import AuthFormComponent, { type AuthState } from "@/components/AuthForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface TxRecord {
  amount_usd: number;
  currency: string;
  status: string;
  created_at: string;
}

const AMOUNTS = [1, 3, 5, 10, 25, 50];

// ─── Top Up Page ───

export default function TopUpPage() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("");
  const [method, setMethod] = useState<"crypto">("crypto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<TxRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pollOrderId, setPollOrderId] = useState<string | null>(null);
  const [pollMethod, setPollMethod] = useState<"crypto">("crypto");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Fetch balance + history
  const fetchUserData = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuth((prev) => prev ? { ...prev, balanceUsd: data.balance_usd } : prev);
        try {
          const saved = localStorage.getItem("stone_auth");
          if (saved) {
            const p = JSON.parse(saved);
            p.balanceUsd = data.balance_usd;
            localStorage.setItem("stone_auth", JSON.stringify(p));
          }
        } catch {}
      }
    } catch {}

    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/transactions?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.transactions || []);
      }
    } catch {}
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (auth?.token) fetchUserData(auth.token);
  }, [auth?.token, fetchUserData]);

  // Poll for payment completion
  useEffect(() => {
    if (!pollOrderId || !auth) return;
    const endpoint = `/api/payment/crypto/check/${pollOrderId}`;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed" || data.status === "success") {
            setPollOrderId(null);
            fetchUserData(auth.token);
          }
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [pollOrderId, pollMethod, auth, fetchUserData]);

  const effectiveAmount = customAmount ? parseFloat(customAmount) : amount;

  const createOrder = async () => {
    if (!auth || effectiveAmount < 1) return;
    setLoading(true);
    setError("");

    const endpoint = "/api/payment/crypto/create-order";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ usd_amount: effectiveAmount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Ошибка создания заказа");
        return;
      }

      const payUrl = data.payment_url;
      const orderId = data.order_id;

      if (payUrl) {
        setPollOrderId(orderId);
        setPollMethod(method);
        window.open(payUrl, "_blank");
      } else {
        setError("Не удалось получить ссылку на оплату");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("stone_auth");
  };

  if (!loaded) return null;
  if (!auth) return <AuthFormComponent onAuth={setAuth} subtitle="Войдите, чтобы выбрать тариф или пополнить баланс" />;

  return (
    <div className="pt-24 min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-surface border-b border-text/5">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-extrabold text-text">Stone AI</a>
          <div className="flex items-center gap-4">
            <a href="/dashboard/chat" className="text-xs text-accent font-semibold hover:underline">Чат</a>
            <span className="text-xs text-text/30">{auth.email}</span>
            <button onClick={logout} className="text-xs text-text/30 hover:text-text">Выйти</button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Balance card */}
        <div className="bg-surface rounded-2xl border border-text/5 p-8 text-center mb-10">
          <p className="text-xs text-text/40 font-semibold uppercase tracking-wide mb-2">Ваш баланс</p>
          <p className="text-4xl font-extrabold text-text">${auth.balanceUsd.toFixed(2)}</p>
          {pollOrderId && (
            <p className="mt-3 text-xs text-accent animate-pulse">Ожидание оплаты... Обновится автоматически.</p>
          )}
        </div>

        {/* Top-up form */}
        <div className="bg-surface rounded-2xl border border-text/5 p-8 mb-10">
          <h2 className="font-bold text-lg mb-6">Пополнить баланс / Выбрать тариф</h2>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-text/50 mb-2">Сумма</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount(""); }}
                  className={`px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                    !customAmount && amount === a
                      ? "bg-accent text-white shadow-sm"
                      : "bg-bg text-text/50 hover:bg-text/5"
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={1000}
              step={0.01}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Своя сумма ($)"
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          {/* Method */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-text/50 mb-2">Способ оплаты</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setMethod("crypto")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  method === "crypto" ? "border-accent bg-accent/5" : "border-text/10 hover:border-text/20"
                }`}
              >
                <div className="font-bold text-sm mb-1">Криптовалюта</div>
                <div className="text-[10px] text-text/40">USDT, BTC, ETH</div>
                <div className="text-[10px] text-text/30 mt-1">Через Heleket</div>
              </button>
            </div>
          </div>

          {/* Summary & Pay */}
          <div className="border-t border-text/5 pt-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-text/50">К оплате</span>
              <span className="text-2xl font-extrabold text-accent">
                ${(effectiveAmount || 0).toFixed(2)}
              </span>
            </div>

            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            <button
              onClick={createOrder}
              disabled={loading || effectiveAmount < 1}
              className="w-full bg-accent text-white py-3.5 min-h-[48px] rounded-xl font-bold hover:bg-accent/90 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
            >
              {loading ? "Создание заказа..." : `Оплатить $${(effectiveAmount || 0).toFixed(2)}`}
            </button>

            <p className="text-[10px] text-text/30 text-center mt-3">
              После нажатия откроется страница оплаты. Баланс обновится автоматически.
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-surface rounded-2xl border border-text/5 p-8">
          <h2 className="font-bold text-lg mb-4">История</h2>

          {historyLoading && <p className="text-sm text-text/30">Загрузка...</p>}

          {!historyLoading && history.length === 0 && (
            <p className="text-sm text-text/30">Пока нет транзакций</p>
          )}

          {history.length > 0 && (
            <div className="space-y-2">
              {history.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-text/[0.03] last:border-0">
                  <div>
                    <span className="text-sm font-medium">+${tx.amount_usd?.toFixed(2) || "?"}</span>
                    <span className="text-xs text-text/30 ml-2">{tx.currency}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      tx.status === "completed" ? "bg-teal-light text-teal" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {tx.status === "completed" ? "Оплачено" : tx.status}
                    </span>
                    <span className="text-[10px] text-text/25">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString("ru-RU") : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
