import type { Metadata } from "next";
import Link from "next/link";
import { COMPARISONS } from "@/lib/seo-data";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Сравнения AI-сервисов и нейросетей 2026",
  description: "Детальные сравнения AI-моделей и платформ: GPT-5 vs Claude, Stone AI vs ChatGPT, и другие. Цены, возможности, тесты.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Сравнения AI-сервисов | Stone AI",
    description: "GPT-5 vs Claude, Stone AI vs ChatGPT и другие сравнения нейросетей.",
  },
};

export default function ComparePage() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Сравнения" }]} />
        <h1 className="text-3xl font-extrabold text-text mt-6 mb-2">Сравнения AI-сервисов и нейросетей</h1>
        <p className="text-text/50 mb-8">Детальные сравнения моделей, платформ и тарифов. Помогаем выбрать лучший AI-инструмент.</p>
        <div className="grid gap-4">
          {COMPARISONS.map(c => (
            <Link key={c.slug} href={`/compare/${c.slug}`}
              className="bg-surface rounded-2xl border border-text/[0.06] p-6 hover:border-accent/20 hover:shadow-md transition-all group">
              <h2 className="text-lg font-bold text-text group-hover:text-accent transition-colors">{c.title}</h2>
              <p className="text-sm text-text/50 mt-1">{c.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
