import type { Metadata } from "next";
import TopUpPage from "@/components/TopUpPage";

export const metadata: Metadata = {
  title: "Пополнить баланс",
  description: "Пополните баланс Stone AI: карты, СБП, USDT, BTC, ETH. От $1. Без VPN.",
};

import Breadcrumbs from "@/components/Breadcrumbs";

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Пополнение" }]} />
      <TopUpPage />
    </>
  );
}
