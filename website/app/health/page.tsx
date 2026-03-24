import type { Metadata } from "next";
import HealthChat from "@/components/HealthChat";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "AI Консультант по здоровью — анализ фото симптомов",
  description:
    "Загрузите фото и получите общую информацию о возможных причинах симптомов. AI-анализ глаз, кожи, высыпаний. Не заменяет врача.",
  openGraph: {
    title: "AI Консультант по здоровью — Stone AI",
    description: "Загрузите фото симптома — AI проанализирует и подскажет к какому врачу обратиться.",
    url: `${SITE_URL}/health`,
  },
};

export default function HealthPage() {
  return <HealthChat />;
}
