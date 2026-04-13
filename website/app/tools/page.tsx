import type { Metadata } from "next";
import Link from "next/link";
import { TOOL_HUBS } from "@/lib/seo-data";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CrossLinks } from "@/components/CrossLinks";

export const metadata: Metadata = {
  title: "AI-инструменты Stone AI — генерация, анализ, автоматизация",
  description: "AI-инструменты для генерации изображений, видео, текстов и кода. 65+ нейросетей в одном интерфейсе. Бесплатный доступ.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "AI-инструменты | Stone AI",
    description: "Генерация изображений, видео, текстов и кода с помощью 65+ нейросетей.",
  },
};

export default function ToolsPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "AI-инструменты", href: "/tools" }]} />
        <h1 className="text-3xl font-extrabold text-text mt-6 mb-2">AI-инструменты Stone AI</h1>
        <p className="text-text/50 mb-8">Генерация изображений, видео, текстов и кода. Выберите категорию и начните работу с лучшими нейросетями 2026 года.</p>
        <div className="grid gap-4">
          {TOOL_HUBS.map(t => (
            <Link key={t.slug} href={`/tools/${t.slug}`}
              className="bg-surface rounded-2xl border border-text/[0.06] p-6 hover:border-accent/20 hover:shadow-md transition-all group">
              <h2 className="text-lg font-bold text-text group-hover:text-accent transition-colors">{t.category}</h2>
              <p className="text-sm text-text/50 mt-1">{t.description}</p>
            </Link>
          ))}
        </div>
        <CrossLinks exclude={["tools"]} />
      </div>
    </div>
  );
}
