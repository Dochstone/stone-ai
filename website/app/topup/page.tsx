import type { Metadata } from "next";
import TopUpPage from "@/components/TopUpPage";

export const metadata: Metadata = {
  title: "Пополнить баланс",
  description: "Пополните баланс Stone AI: Stars, USDT, BTC, ETH, TON. От $1. Оплата в рублях.",
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
