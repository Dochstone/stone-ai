import type { Metadata } from "next";
import TopUpPage from "@/components/TopUpPage";

export const metadata: Metadata = {
  title: "Пополнить баланс — Stone AI",
  description: "Пополните баланс Stone AI: карты, СБП, USDT, BTC, ETH. От $1. Без VPN.",
};

export default function Page() {
  return <TopUpPage />;
}
