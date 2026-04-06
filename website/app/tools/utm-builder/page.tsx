import type { Metadata } from "next";
import UTMBuilder from "@/components/tools/UTMBuilder";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "UTM-генератор онлайн бесплатно",
  description:
    "Бесплатный генератор UTM-меток для Яндекс Директ, Google Ads, VK, Telegram. Пресеты, динамические переменные, транслитерация, сокращение ссылок.",
  keywords: [
    "UTM генератор",
    "UTM метки",
    "UTM онлайн",
    "создать UTM",
    "Яндекс Директ UTM",
    "Google Ads UTM",
    "UTM ссылка",
  ],
};

export default function UTMBuilderPage() {
  return (
    <div className="pt-24 min-h-screen pb-20">
      <Breadcrumbs items={[{ label: "Инструменты", href: "/tools/utm-builder" }, { label: "UTM-генератор" }]} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Бесплатный инструмент
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            UTM-генератор{" "}
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">онлайн</span>
          </h1>
          <p className="text-text/50 max-w-xl mx-auto">
            Создавайте UTM-метки для Яндекс Директ, Google Ads, VK и Telegram за секунды. Пресеты, переменные, транслитерация.
          </p>
        </div>
        <UTMBuilder />
      </div>
    </div>
  );
}
