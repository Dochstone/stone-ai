import type { Metadata } from "next";
import Link from "next/link";
import { PROFESSIONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "AI для профессионалов — нейросети по профессиям 2026",
  description: "AI-инструменты для маркетологов, программистов, копирайтеров, дизайнеров и студентов. Лучшие нейросети для каждой профессии.",
  alternates: { canonical: `${SITE_URL}/for` },
  openGraph: {
    title: "AI для профессионалов | Stone AI",
    description: "Нейросети по профессиям: маркетинг, разработка, копирайтинг, дизайн, учёба.",
    url: `${SITE_URL}/for`,
    type: "website",
    siteName: "Stone AI",
    images: [{ url: `${SITE_URL}/og-for.png`, width: 1200, height: 630, alt: "AI для профессионалов — Stone AI" }],
  },
};

export default function ForPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "AI по профессиям", href: "/for" }]} />
        <h1 className="text-3xl font-extrabold text-text mt-6 mb-2">AI для профессионалов — нейросети по профессиям</h1>
        <p className="text-text/50 mb-8">Подборки лучших AI-моделей и промптов для каждой профессии. Узнайте, как нейросети ускоряют вашу работу.</p>
        <div className="grid gap-4">
          {PROFESSIONS.map(p => (
            <Link key={p.slug} href={`/for/${p.slug}`}
              className="bg-surface rounded-2xl border border-text/[0.06] p-6 hover:border-accent/20 hover:shadow-md transition-all group">
              <h2 className="text-lg font-bold text-text group-hover:text-accent transition-colors">{p.role} — {p.title}</h2>
              <p className="text-sm text-text/50 mt-1">{p.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
