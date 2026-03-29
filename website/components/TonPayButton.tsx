"use client";

import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";
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
  const [debug, setDebug] = useState("");

  const priceUsd = TIER_PRICES_USD[tier];

  // Debug: log wallet state every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      const w = tonConnectUI?.wallet;
      const connected = tonConnectUI?.connected;
      setDebug(
        `connected: ${connected}, wallet: ${w ? "yes" : "no"}, hook: ${wallet ? "yes" : "no"}`
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [tonConnectUI, wallet]);

  // Fetch TON rate
  useEffect(() => {
    fetch(`${API_URL}/api/payment/ton-rate`)
      .then((r) => r.json())
      .then((d) => setTonRate(d.ton_usd || 3.5))
      .catch(() => setTonRate(3.5));
  }, []);

  const connected = !!wallet;
  const amountTon = tonRate > 0 && priceUsd ? (priceUsd / tonRate) : 0;

  const handleConnect = useCallback(async () => {
    try {
      await tonConnectUI.openModal();
    } catch (e: any) {
      setError(e?.message || "Ошибка подключения");
    }
  }, [tonConnectUI]);

  const handlePay = useCallback(async () => {
    if (!priceUsd) return;
    setError("");
    setLoading(true);
    setStatus("Получение курса...");

    try {
      const authStr = localStorage.getItem("stone_auth");
      if (!authStr) {
        setError("Сначала войдите в аккаунт на сайте");
        setLoading(false);
        setStatus("");
        return;
      }
      const auth = JSON.parse(authStr);

      const rateRes = await fetch(`${API_URL}/api/payment/ton-rate`);
      const { ton_usd: currentRate } = await rateRes.json();
      if (!currentRate) {
        setError("Не удалось получить курс TON");
        setLoading(false);
        setStatus("");
        return;
      }

      const payAmountTon = priceUsd / currentRate;
      const amountNano = Math.ceil(payAmountTon * 1e9).toString();

      setStatus("Создание заказа...");
      const orderRes = await fetch(`${API_URL}/api/payment/ton-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ tier, amount_ton: payAmountTon }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.detail || "Ошибка"); setLoading(false); setStatus(""); return; }

      setStatus("Подтвердите в кошельке...");
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: MERCHANT_WALLET, amount: amountNano }],
      });

      setStatus("Ожидание подтверждения...");
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const checkRes = await fetch(
            `${API_URL}/api/payment/ton-check?order_id=${orderData.order_id}`,
            { headers: { Authorization: `Bearer ${auth.token}` } }
          );
          const checkData = await checkRes.json();
          if (checkData.status === "confirmed") { setStatus(""); onSuccess?.(); setLoading(false); return; }
        } catch {}
      }
      setError("Транзакция отправлена. Подписка активируется в течение 1-2 минут.");
    } catch (err: any) {
      setError(err?.message?.includes("reject") ? "Отменено" : (err?.message || "Ошибка"));
    }
    setLoading(false);
    setStatus("");
  }, [tier, priceUsd, tonConnectUI, onSuccess]);

  if (!priceUsd) return null;

  const addr = wallet?.account?.address;
  const shortAddr = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <div>
      {!connected ? (
        <button
          onClick={handleConnect}
          className="w-full flex items-center justify-center gap-2 bg-[#0098EA] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0080C0] transition-colors"
        >
          <span className="font-extrabold text-lg">T</span>
          Подключить кошелёк TON
        </button>
      ) : (
        <>
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0098EA] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0080C0] transition-colors disabled:opacity-60"
          >
            <span className="font-extrabold text-lg">T</span>
            {status || `Оплатить ~${amountTon.toFixed(2)} TON (~$${priceUsd})`}
          </button>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[10px] text-[#0098EA] font-medium">{shortAddr}</p>
            <button
              onClick={(e) => { e.stopPropagation(); tonConnectUI.disconnect(); }}
              className="text-[10px] text-text/30 hover:text-red-500 transition-colors"
            >
              Отключить
            </button>
          </div>
        </>
      )}
      {/* Debug info — temporarily visible */}
      <p className="text-[9px] text-text/20 mt-1 text-center font-mono">{debug}</p>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
}
