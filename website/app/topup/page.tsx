import type { Metadata } from "next";
import TopUpPage from "@/components/TopUpPage";

export const metadata: Metadata = {
  title: "Пополнение и тарифы",
  description: "Выберите тариф Stone AI или пополните баланс: Stars, USDT, BTC, ETH, TON. Подписка от 390₽/мес.",
  alternates: { canonical: "/topup" },
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
