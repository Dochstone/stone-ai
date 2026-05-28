import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, MessageSquare, Sparkles } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import { LOCATIONS, LOCATION_PRODUCT_LINKS } from "@/lib/locations";

export const metadata: Metadata = {
  title: "Stone AI в городах России - AI для бизнеса",
  description:
    "Выберите город и посмотрите, как Stone AI помогает бизнесу автоматизировать ответы клиентам, контент, документы и продажи.",
  alternates: { canonical: "/locations" },
  openGraph: {
    title: "Stone AI в городах России - AI для бизнеса",
    description:
      "Городские страницы Stone AI для бизнеса: AI-чат, тексты, визуалы, документы и автоматизация задач без VPN.",
    url: `${SITE_URL}/locations`,
    type: "website",
    siteName: "Stone AI",
  },
};

const faqItems = [
  {
    question: "Зачем Stone AI делает страницы по городам?",
    answer:
      "Чтобы показать бизнесу в разных городах конкретные сценарии: ответы клиентам, контент, продажи, документы, визуалы и работа с нейросетями без VPN.",
  },
  {
    question: "Отличаются ли городские страницы друг от друга?",
    answer:
      "Да. У каждой страницы свой акцент по нишам, примерам, вопросам и сценариям: для Сочи важнее туризм, для Екатеринбурга B2B, для Казани локальный бизнес.",
  },
  {
    question: "Можно ли использовать Stone AI из любого города России?",
    answer:
      "Да. Stone AI работает онлайн и доступен из разных городов России. Для работы с AI-чатом и инструментами не нужен VPN.",
  },
];

export default function LocationsPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Stone AI в городах России",
    description: metadata.description,
    url: `${SITE_URL}/locations`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: LOCATIONS.map((location, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: location.city,
        url: `${SITE_URL}/locations/${location.slug}`,
      })),
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Города", href: "/locations" }]} />

        <section className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-accent/15 bg-accent/5 px-3 py-1 text-xs font-bold text-accent">
              <MapPin className="h-4 w-4" />
              Городские страницы Stone AI
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-text sm:text-5xl">
              Stone AI для бизнеса в городах России
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-text/60 sm:text-lg">
              Выберите город и посмотрите, как Stone AI помогает локальному бизнесу быстрее отвечать клиентам,
              готовить контент, обрабатывать документы, создавать визуалы и использовать 65+ нейросетей в одном интерфейсе.
            </p>
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

          <div className="rounded-2xl border border-text/[0.06] bg-surface p-6">
            <img
              src="/mascots/stone-mascot-idle.webp?v=2"
              alt="Stone AI"
              width="96"
              height="96"
              loading="eager"
              className="mb-5 h-24 w-24"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-bg p-4">
                <div className="text-2xl font-extrabold text-text">{LOCATIONS.length}</div>
                <div className="mt-1 text-xs font-semibold text-text/45">городов в первой версии</div>
              </div>
              <div className="rounded-xl bg-bg p-4">
                <div className="text-2xl font-extrabold text-text">65+</div>
                <div className="mt-1 text-xs font-semibold text-text/45">AI-моделей в одном сервисе</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-text">Выберите город</h2>
              <p className="mt-2 text-sm text-text/50">Каждая страница собрана под локальные задачи и приоритетные ниши.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOCATIONS.map((location) => (
              <Link
                key={location.slug}
                href={`/locations/${location.slug}`}
                className="group rounded-2xl border border-text/[0.06] bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-text transition-colors group-hover:text-accent">
                      {location.city}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-text/35">{location.region}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-text/25 transition-colors group-hover:text-accent" />
                </div>
                <p className="text-sm leading-relaxed text-text/55">{location.focus}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {location.industries.slice(0, 3).map((industry) => (
                    <span key={industry} className="rounded-lg bg-bg px-2.5 py-1 text-xs font-semibold text-text/45">
                      {industry}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-text/[0.06] bg-surface p-5">
            <MessageSquare className="mb-4 h-6 w-6 text-accent" />
            <h2 className="text-lg font-extrabold text-text">Ответы клиентам</h2>
            <p className="mt-2 text-sm leading-relaxed text-text/55">
              Шаблоны для заявок, записи, бронирований, консультаций, отзывов и повторных продаж.
            </p>
          </div>
          <div className="rounded-2xl border border-text/[0.06] bg-surface p-5">
            <Sparkles className="mb-4 h-6 w-6 text-accent" />
            <h2 className="text-lg font-extrabold text-text">Контент и визуалы</h2>
            <p className="mt-2 text-sm leading-relaxed text-text/55">
              Посты, рассылки, рекламные тексты, изображения, видео-идеи и материалы для сайта.
            </p>
          </div>
          <div className="rounded-2xl border border-text/[0.06] bg-surface p-5">
            <Building2 className="mb-4 h-6 w-6 text-accent" />
            <h2 className="text-lg font-extrabold text-text">Бизнес-задачи</h2>
            <p className="mt-2 text-sm leading-relaxed text-text/55">
              Коммерческие предложения, документы, инструкции, FAQ, скрипты продаж и аналитика.
            </p>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-extrabold text-text">Инструменты Stone AI</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {LOCATION_PRODUCT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-text/[0.06] bg-surface px-4 py-2.5 text-sm font-semibold text-text/70 transition-colors hover:border-accent/30 hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 space-y-3">
          <h2 className="text-2xl font-extrabold text-text">Частые вопросы</h2>
          {faqItems.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-text/[0.06] bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold text-text">
                {item.question}
                <ArrowRight className="h-4 w-4 text-text/25 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-text/55">{item.answer}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
