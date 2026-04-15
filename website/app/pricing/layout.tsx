import type { Metadata } from "next";
import { planPrice, planPriceFull } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Тарифы и цены",
  description:
    `Тарифы Stone AI: Free (бесплатно), Start (${planPriceFull("mini")}), Pro (${planPriceFull("max")}), Elite (${planPriceFull("max-pro")}). 65+ нейросетей, картинки, видео, 3D. Оплата криптой и Stars.`,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: `Тарифы Stone AI — от ${planPriceFull("mini")}`,
    description:
      "4 тарифа: Free, Start, Pro, Elite. До 65+ нейросетей, генерация картинок, видео и 3D. Бесплатный старт.",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
