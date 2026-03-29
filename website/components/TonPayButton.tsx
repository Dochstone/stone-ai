"use client";

import { useTonConnectUI, useTonWallet, useTonAddress } from "@tonconnect/ui-react";
import { useState, useEffect } from "react";

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
  const address = useTonAddress(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "paying" | "polling">("idle");
  const [error, setError] = useState("");
  const [tonRate, setTonRate] = useState<number>(0);

  const priceUsd = TIER_PRICES_USD[tier];
  if (!priceUsd) return null;

  // Fetch TON rate on mount
  useEffect(() => {
    fetch(`${API_URL}/api/payment/ton-rate`)
      .then((r) => r.json())
      .then((d) => setTonRate(d.ton_usd || 3.5))
      .catch(() => setTonRate(3.5));
  }, []);

  const amountTon = tonRate > 0 ? (priceUsd / tonRate) : 0;

  const handleClick = async () => {
    setError("");

    // If no wallet — open connect modal
    if (!wallet) {
      setStatus("connecting");
      await tonConnectUI.openModal();
      setStatus("idle");
      return;
    }

    // Wallet connected — proceed to payment
    await handlePay();
  };

  const handlePay = async () => {
    setLoading(true);
    setStatus("paying");
    setError("");

    try {
      const authStr = localStorage.getItem("stone_auth");
      if (!authStr) {
        setError("Сначала войдите в аккаунт");
        setLoading(false);
        setStatus("idle");
        return;
      }
      const auth = JSON.parse(authStr);

      // Get fresh rate
      const rateRes = await fetch(`${API_URL}/api/payment/ton-rate`);
      const rateData = await rateRes.json();
      const currentRate = rateData.ton_usd;
      if (!currentRate || currentRate <= 0) {
        setError("Не удалось получить курс TON");
        setLoading(false);
        setStatus("idle");
        return;
      }

      const payAmountTon = priceUsd / currentRate;
      const amountNano = Math.ceil(payAmountTon * 1e9).toString();

      // Create order
      const orderRes = await fetch(`${API_URL}/api/payment/ton-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ tier, amount_ton: payAmountTon }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.detail || "Ошибка создания заказа");
        setLoading(false);
        setStatus("idle");
        return;
      }

      // Send transaction
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: MERCHANT_WALLET,
            amount: amountNano,
          },
        ],
      });

      // Poll for confirmation
      setStatus("polling");
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const checkRes = await fetch(
            `${API_URL}/api/payment/ton-check?order_id=${orderData.order_id}`,
            { headers: { Authorization: `Bearer ${auth.token}` } }
          );
          const checkData = await checkRes.json();
          if (checkData.status === "confirmed") {
            confirmed = true;
            break;
          }
        } catch {}
      }

      if (confirmed) {
        onSuccess?.();
      } else {
        setError("Транзакция отправлена. Подписка активируется в течение 1-2 минут.");
      }
    } catch (err: any) {
      if (err?.message?.includes("reject")) {
        setError("Транзакция отменена");
      } else {
        setError(err?.message || "Ошибка оплаты");
      }
    }

    setLoading(false);
    setStatus("idle");
  };

  const shortAddr = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "";

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#0098EA] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0080C0] transition-colors disabled:opacity-50"
      >
        <span className="font-extrabold text-base">T</span>
        {status === "polling"
          ? "Ожидание подтверждения..."
          : status === "paying"
          ? "Подтвердите в кошельке..."
          : wallet
          ? `Оплатить ~${amountTon.toFixed(2)} TON (~$${priceUsd})`
          : "Подключить кошелёк TON"}
      </button>
      {wallet && (
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-text/30">
            Кошелёк: {shortAddr}
          </p>
          <button
            onClick={() => tonConnectUI.disconnect()}
            className="text-[10px] text-text/30 hover:text-red-500 transition-colors"
          >
            Отключить
          </button>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
