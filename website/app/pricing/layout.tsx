import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тарифы и цены",
  description:
    "Тарифы Stone AI: Free (бесплатно), Start (590₽/мес), Pro (1 290₽/мес), Elite (2 990₽/мес). 65+ нейросетей, картинки, видео, 3D. Оплата криптой и Stars.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Тарифы Stone AI — от 590₽/мес",
    description:
      "4 тарифа: Free, Start, Pro, Elite. До 65+ нейросетей, генерация картинок, видео и 3D. Бесплатный старт.",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
