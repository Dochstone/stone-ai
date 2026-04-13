import type { Metadata } from "next";
import Link from "next/link";
import ReferralPage from "@/components/ReferralPage";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Реферальная программа Stone AI — получайте 10% от пополнений друзей",
  description: "Приглашайте друзей в Stone AI и получайте 10% от их пополнений на свой баланс. Бессрочная реферальная программа без ограничений.",
  alternates: { canonical: "/referral" },
  openGraph: {
    title: "Реферальная программа Stone AI — получайте 10% от пополнений друзей",
    description: "Приглашайте друзей в Stone AI и получайте 10% от их пополнений на свой баланс. Бессрочная реферальная программа без ограничений.",
  },
};

const faqItems = [
  { q: "Сколько я получу за приглашённого друга?", a: "Вы получаете 10% от каждого пополнения баланса вашего реферала. Например, если друг пополнит на 1000₽ — вам начислится 100₽ на баланс. Процент начисляется с каждого пополнения, а не только с первого." },
  { q: "Есть ли ограничение на количество рефералов?", a: "Нет, ограничений нет. Вы можете приглашать неограниченное количество друзей. Чем больше активных рефералов — тем больше ваш пассивный доход." },
  { q: "Как долго действует реферальная программа?", a: "Реферальная связь бессрочная. Вы получаете 10% от пополнений реферала всё время, пока он пользуется Stone AI. Программа действует без ограничения по времени." },
  { q: "Когда начисляются реферальные бонусы?", a: "Бонус начисляется мгновенно после пополнения баланса вашим рефералом. Средства сразу доступны на вашем балансе и могут быть использованы для запросов к любым нейросетям." },
  { q: "Можно ли вывести реферальные бонусы?", a: "Реферальные бонусы зачисляются на баланс Stone AI и могут использоваться для оплаты запросов к 65+ нейросетям, генерации изображений, видео и других функций платформы." },
];

export default function Page() {
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Реферальная программа", href: "/referral" }]} />
      <h1 className="sr-only">Реферальная программа Stone AI</h1>
      <ReferralPage />

      {/* SEO content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        {/* How it works */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Как работает реферальная программа Stone AI</h2>
          <p className="text-sm text-text/50 mb-8 max-w-2xl">Приглашайте друзей и коллег в Stone AI — получайте 10% от каждого их пополнения на свой баланс. Три простых шага для начала:</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-bg rounded-2xl border border-text/5 p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent font-extrabold text-lg">1</span>
              </div>
              <h3 className="font-bold text-text mb-2">Скопируйте ссылку</h3>
              <p className="text-sm text-text/50">Зарегистрируйтесь в Stone AI и скопируйте вашу уникальную реферальную ссылку в личном кабинете. Ссылка генерируется автоматически.</p>
            </div>
            <div className="bg-bg rounded-2xl border border-text/5 p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent font-extrabold text-lg">2</span>
              </div>
              <h3 className="font-bold text-text mb-2">Поделитесь с друзьями</h3>
              <p className="text-sm text-text/50">Отправьте ссылку друзьям, коллегам или подписчикам. Поделитесь в соцсетях, мессенджерах или блоге — любой переход по ссылке засчитывается.</p>
            </div>
            <div className="bg-bg rounded-2xl border border-text/5 p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent font-extrabold text-lg">3</span>
              </div>
              <h3 className="font-bold text-text mb-2">Получайте бонусы</h3>
              <p className="text-sm text-text/50">Когда приглашённый друг пополняет баланс, вы мгновенно получаете 10% на свой счёт. Бонусы начисляются с каждого пополнения без ограничений.</p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Преимущества реферальной программы</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: "10% от каждого пополнения", desc: "Не разовый бонус, а постоянный процент с каждого пополнения реферала." },
              { title: "Без ограничений по рефералам", desc: "Приглашайте сколько угодно друзей — лимита нет." },
              { title: "Мгновенное начисление", desc: "Бонус появляется на балансе сразу после пополнения рефералом." },
              { title: "Бессрочная связь", desc: "Реферальная привязка не истекает — бонусы начисляются всегда." },
              { title: "Прозрачная статистика", desc: "В личном кабинете видно количество рефералов и сумму начислений." },
              { title: "Используйте на всё", desc: "Бонусы тратятся на любые функции: чат с 65+ нейросетями, картинки, видео, SEO." },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3 bg-bg rounded-xl border border-text/5 p-4">
                <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <div>
                  <span className="text-sm font-bold text-text">{b.title}</span>
                  <p className="text-sm text-text/50 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Частые вопросы о реферальной программе</h2>
          <div className="space-y-3">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-bg rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text/80 list-none flex items-center justify-between">{f.q}<svg className="w-4 h-4 text-text/20 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></summary>
                <p className="px-5 pb-4 text-sm text-text/50 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Начните зарабатывать с Stone AI</h2>
          <p className="text-white/40 text-sm mb-6">Зарегистрируйтесь, скопируйте реферальную ссылку и получайте 10% от пополнений друзей.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Получить реферальную ссылку <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>
      </div>
    </>
  );
}
