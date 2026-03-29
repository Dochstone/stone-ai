"use client";

import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

// TON merchant wallet (UQ format → raw for transactions)
const MERCHANT_WALLET = "UQBfxl37Bgf7FVaO4prAM5YA0d9pfJdRL7hymmYZX01Skjc7";

// Prices in USD, will convert to TON
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
  const [error, setError] = useState("");

  const priceUsd = TIER_PRICES_USD[tier];
  if (!priceUsd) return null;

  const handlePay = async () => {
    setError("");
    setLoading(true);

    try {
      // 1. Get auth
      const authStr = localStorage.getItem("stone_auth");
      if (!authStr) {
        setError("Сначала войдите в аккаунт");
        setLoading(false);
        return;
      }
      const auth = JSON.parse(authStr);

      // 2. If not connected — connect wallet
      if (!wallet) {
        await tonConnectUI.openModal();
        setLoading(false);
        return;
      }

      // 3. Get TON price from backend
      const rateRes = await fetch(`${API_URL}/api/payment/ton-rate`);
      const rateData = await rateRes.json();
      const tonPriceUsd = rateData.ton_usd;
      if (!tonPriceUsd || tonPriceUsd <= 0) {
        setError("Не удалось получить курс TON");
        setLoading(false);
        return;
      }

      const amountTon = priceUsd / tonPriceUsd;
      const amountNano = Math.ceil(amountTon * 1e9).toString();

      // 4. Create order on backend to get unique comment
      const orderRes = await fetch(`${API_URL}/api/payment/ton-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ tier, amount_ton: amountTon }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.detail || "Ошибка создания заказа");
        setLoading(false);
        return;
      }

      const comment = orderData.comment; // unique payment ID

      // 5. Send transaction via TON Connect
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 min
        messages: [
          {
            address: MERCHANT_WALLET,
            amount: amountNano,
            payload: btoa(comment), // comment as base64 payload
          },
        ],
      };

      await tonConnectUI.sendTransaction(tx);

      // 6. Poll backend for confirmation
      setError("");
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const checkRes = await fetch(
          `${API_URL}/api/payment/ton-check?order_id=${orderData.order_id}`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        const checkData = await checkRes.json();
        if (checkData.status === "confirmed") {
          confirmed = true;
          break;
        }
      }

      if (confirmed) {
        onSuccess?.();
      } else {
        setError(
          "Транзакция отправлена, но ещё не подтверждена. Подписка активируется автоматически в течение 1-2 минут."
        );
      }
    } catch (err: any) {
      if (err?.message?.includes("User rejected")) {
        setError("Транзакция отменена");
      } else {
        setError("Ошибка оплаты: " + (err?.message || "попробуйте ещё раз"));
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#0098EA] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0080C0] transition-colors disabled:opacity-50"
      >
        <span className="font-extrabold text-base">T</span>
        {loading
          ? "Обработка..."
          : wallet
          ? `Оплатить ~$${priceUsd} в TON`
          : "Подключить кошелёк TON"}
      </button>
      {error && (
        <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
