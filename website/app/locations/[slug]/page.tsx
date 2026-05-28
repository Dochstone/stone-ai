import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, MapPin, MessageSquare, Sparkles } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import { getLocation, getRelatedLocations, LOCATION_PRODUCT_LINKS, LOCATIONS } from "@/lib/locations";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return LOCATIONS.map((location) => ({ slug: location.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const location = getLocation(params.slug);
  if (!location) return {};

  return {
    title: location.title,
    description: location.description,
    alternates: { canonical: `/locations/${location.slug}` },
    openGraph: {
      title: location.title,
      description: location.description,
      url: `${SITE_URL}/locations/${location.slug}`,
      type: "article",
      siteName: "Stone AI",
    },
  };
}

export default function LocationPage({ params }: Props) {
  const location = getLocation(params.slug);
  if (!location) notFound();

  const relatedLocations = getRelatedLocations(location);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: location.h1,
    description: location.description,
    url: `${SITE_URL}/locations/${location.slug}`,
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Stone AI",
      url: SITE_URL,
    },
    areaServed: {
      "@type": "City",
      name: location.city,
      containedInPlace: location.region,
    },
    serviceType: "AI tools, chatbot, business automation",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Инструменты Stone AI для бизнеса",
      itemListElement: LOCATION_PRODUCT_LINKS.map((link) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: link.label,
          url: `${SITE_URL}${link.href}`,
        },
      })),
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: location.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-bg pt-24 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Города", href: "/locations" },
            { label: location.city, href: `/locations/${location.slug}` },
          ]}
        />

        <section className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-accent/15 bg-accent/5 px-3 py-1 text-xs font-bold text-accent">
              <MapPin className="h-4 w-4" />
              Stone AI в {location.prepositional}
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-text sm:text-5xl">
              {location.h1}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-text/60 sm:text-lg">{location.lead}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard/chat"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/90"
              >
                Открыть AI-чат
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-text/[0.08] bg-surface px-5 py-3 text-sm font-bold text-text transition-colors hover:border-accent/30"
              >
                Посмотреть тарифы
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-text/[0.06] bg-surface p-6">
            <img
              src="/mascots/stone-mascot-idle.webp?v=2"
              alt="Stone AI"
              width="88"
              height="88"
              loading="eager"
              className="mb-5 h-20 w-20"
            />
            <p className="text-xs font-bold uppercase tracking-wider text-text/30">Локальный фокус</p>
            <p className="mt-2 text-lg font-extrabold leading-snug text-text">{location.focus}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {location.industries.map((industry) => (
                <span key={industry} className="rounded-lg bg-bg px-2.5 py-1 text-xs font-semibold text-text/50">
                  {industry}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-14">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-text">Для каких задач подходит в {location.prepositional}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text/50">
              Stone AI не обещает локальное внедрение под ключ. Это рабочий набор AI-инструментов для команд,
              предпринимателей и специалистов, которым нужно быстрее закрывать повседневные задачи.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {location.useCases.map((item) => (
              <div key={item.title} className="rounded-2xl border border-text/[0.06] bg-surface p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text/55">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-extrabold text-text">Локальные примеры</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {location.examples.map((item) => (
              <div key={item.title} className="rounded-2xl border border-text/[0.06] bg-surface p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">{item.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-text/60">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-2xl border border-text/[0.06] bg-surface">
          <div className="grid divide-y divide-text/[0.06] md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="p-5">
              <MessageSquare className="mb-4 h-6 w-6 text-accent" />
              <h2 className="text-lg font-extrabold text-text">Коммуникация</h2>
              <p className="mt-2 text-sm leading-relaxed text-text/55">
                Ответы клиентам, записи, бронирования, отзывы, рассылки и скрипты для менеджеров.
              </p>
            </div>
            <div className="p-5">
              <Sparkles className="mb-4 h-6 w-6 text-accent" />
              <h2 className="text-lg font-extrabold text-text">Контент</h2>
              <p className="mt-2 text-sm leading-relaxed text-text/55">
                Посты, лендинги, рекламные тексты, изображения, видео-идеи и визуальные концепции.
              </p>
            </div>
            <div className="p-5">
              <FileText className="mb-4 h-6 w-6 text-accent" />
              <h2 className="text-lg font-extrabold text-text">Документы</h2>
              <p className="mt-2 text-sm leading-relaxed text-text/55">
                Выжимки из договоров, ТЗ, инструкций, прайсов, длинных переписок и внутренних материалов.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-extrabold text-text">Связанные инструменты</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LOCATION_PRODUCT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-text/[0.06] bg-surface px-5 py-4 text-sm font-bold text-text transition-colors hover:border-accent/30"
              >
                {link.label}
                <ArrowRight className="h-4 w-4 text-text/25 transition-colors group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 space-y-3">
          <h2 className="text-2xl font-extrabold text-text">Частые вопросы</h2>
          {location.faq.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-text/[0.06] bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold text-text">
                {item.question}
                <ArrowRight className="h-4 w-4 shrink-0 text-text/25 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-text/55">{item.answer}</p>
            </details>
          ))}
        </section>

        {relatedLocations.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-extrabold text-text">Другие города</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedLocations.map((related) => (
                <Link
                  key={related.slug}
                  href={`/locations/${related.slug}`}
                  className="group rounded-2xl border border-text/[0.06] bg-surface p-5 transition-colors hover:border-accent/30"
                >
                  <h3 className="font-extrabold text-text group-hover:text-accent">{related.city}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-text/50">{related.focus}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-2xl border border-accent/10 bg-accent/5 p-6 text-center sm:p-8">
          <h2 className="text-2xl font-extrabold text-text">Запустите AI для задач бизнеса в {location.prepositional}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-text/60">
            Начните с AI-чата: тексты, ответы клиентам, документы, изображения и идеи для продаж доступны в одном кабинете.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/90"
            >
              Попробовать Stone AI
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 rounded-xl border border-text/[0.08] bg-surface px-5 py-3 text-sm font-bold text-text transition-colors hover:border-accent/30"
            >
              Все города
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
