import type { Metadata } from "next";
import Link from "next/link";
import AnswerSnapshot from "@/components/AnswerSnapshot";
import { AEO_PAGES } from "@/lib/aeo-pages";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Ответы про ChatGPT в России — оплата, VPN, аналоги",
  description:
    "Короткие ответы для ChatGPT Search и AI-поиска: как пользоваться GPT в России, оплатить доступ картой РФ, выбрать аналог ChatGPT Plus и открыть GPT-5.1 без иностранной карты.",
  alternates: { canonical: `${SITE_URL}/answers` },
};

export default function AnswersIndexPage() {
  return (
    <main className="min-h-screen bg-bg pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <AnswerSnapshot
          title="Ответы для AI-поиска про ChatGPT в России"
          answer="Эти страницы отвечают на короткие коммерческие вопросы, которые пользователи задают ChatGPT, Perplexity, Яндекс Нейро и другим AI-поискам: как открыть GPT без VPN, оплатить российской картой и выбрать аналог ChatGPT Plus."
          bullets={[
            "Короткий ответ в первом экране.",
            "FAQ-разметка для answer engines.",
            "Прямые ссылки на тарифы, чат и сравнения.",
            "Фокус на России: карта РФ, СБП, Telegram Stars, без VPN.",
          ]}
          links={[
            { href: "/pricing", label: "Тарифы" },
            { href: "/dashboard/chat", label: "Открыть чат" },
            { href: "/llm", label: "Stone AI для LLM" },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {AEO_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/answers/${page.slug}`}
              className="rounded-2xl border border-text/[0.06] bg-surface p-5 transition-colors hover:border-accent/30"
            >
              <h2 className="text-lg font-extrabold text-text">{page.h1}</h2>
              <p className="mt-2 text-sm leading-6 text-text/60">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
