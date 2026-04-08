"use client";

import { TonConnectButton, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const MERCHANT_WALLET = "UQBfxl37Bgf7FVaO4prAM5YA0d9pfJdRL7hymmYZX01Skjc7";

const TIER_PRICES_USD: Record<string, number> = {
  mini: 4.0,
  max: 9.0,
  "max-pro": 20.0,
};

export default function TonPayButton({
  tier,
  onSuccess,
}: {
  tier: string;
  onSuccess?: () => void;
}) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [tonRate, setTonRate] = useState<number>(0);

  const priceUsd = TIER_PRICES_USD[tier];

  useEffect(() => {
    fetch(`${API_URL}/api/payment/ton-rate`)
      .then((r) => r.json())
      .then((d) => setTonRate(d.ton_usd || 3.5))
      .catch(() => setTonRate(3.5));
  }, []);

  const connected = !!wallet;
  const amountTon = tonRate > 0 && priceUsd ? (priceUsd / tonRate) : 0;

  const handlePay = useCallback(async () => {
    if (!priceUsd) return;
    setError("");
    setLoading(true);

    try {
      const authStr = localStorage.getItem("stone_auth");
      if (!authStr) { setError("Сначала войдите в аккаунт"); setLoading(false); return; }
      const auth = JSON.parse(authStr);

      setStatus("Курс TON...");
      const { ton_usd: rate } = await (await fetch(`${API_URL}/api/payment/ton-rate`)).json();
      if (!rate) { setError("Не удалось получить курс"); setLoading(false); setStatus(""); return; }

      const payTon = priceUsd / rate;
      const nano = Math.ceil(payTon * 1e9).toString();

      setStatus("Создание заказа...");
      const orderRes = await fetch(`${API_URL}/api/payment/ton-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ tier, amount_ton: payTon }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) { setError(order.detail || "Ошибка"); setLoading(false); setStatus(""); return; }

      setStatus("Подтвердите в кошельке...");
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: MERCHANT_WALLET, amount: nano }],
      });

      setStatus("Ожидание...");
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const { status: s } = await (await fetch(
            `${API_URL}/api/payment/ton-check?order_id=${order.order_id}`,
            { headers: { Authorization: `Bearer ${auth.token}` } }
          )).json();
          if (s === "confirmed") { onSuccess?.(); setLoading(false); setStatus(""); return; }
        } catch {}
      }
      setError("Транзакция отправлена. Подписка активируется через 1-2 мин.");
    } catch (err: any) {
      setError(err?.message?.includes("reject") ? "Отменено" : (err?.message || "Ошибка"));
    }
    setLoading(false);
    setStatus("");
  }, [tier, priceUsd, tonConnectUI, onSuccess]);

  if (!priceUsd) return null;

  return (
    <div className="space-y-2">
      {/* Step 1: Connect wallet using official TonConnectButton */}
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <TonConnectButton />
        </div>
        <p className="text-xs text-text/40">
          {connected ? "Кошелёк подключён" : "Подключите кошелёк TON"}
        </p>
      </div>

      {/* Step 2: Pay button (only when connected) */}
      {connected && (
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#0098EA] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0080C0] transition-colors disabled:opacity-60"
        >
          <span className="font-extrabold text-lg">T</span>
          {status || `Оплатить ~${amountTon.toFixed(2)} TON (~$${priceUsd})`}
        </button>
      )}

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
