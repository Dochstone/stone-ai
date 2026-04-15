import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import ScrollToTop from "@/components/ScrollToTop";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
// WelcomeBonusBanner moved inside Nav to fix z-index overlap
import WebVitals from "@/components/WebVitals";
import TonProvider from "@/components/TonProvider";
import PageTracker from "@/components/PageTracker";
import CookieBanner from "@/components/CookieBanner";
import TelegramWebApp from "@/components/TelegramWebApp";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

import { SITE_URL } from "@/lib/constants";
import { planPrice, planPriceFull, planPriceNum } from "@/lib/pricing";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stone AI — агрегатор 65+ нейросетей без VPN, оплата рублями",
    template: "%s | Stone AI",
  },
  description:
    "Stone AI — агрегатор 65+ нейросетей в одном окне: GPT-5, Claude Opus 4.5, Midjourney, Sora, DeepSeek. Без VPN, оплата картой РФ, на русском. 15 инструментов: чат, картинки, видео, SEO, презентации. Бесплатный старт 10 запросов/день.",
  keywords: [
    "агрегатор нейросетей",
    "все нейросети в одном месте",
    "нейросети без VPN",
    "нейросеть на русском",
    "ChatGPT без VPN",
    "ChatGPT на русском",
    "Claude Opus 4.5",
    "GPT-5",
    "аналог ChatGPT",
    "аналог Midjourney бесплатно",
    "Midjourney без VPN",
    "Sora 2 без VPN",
    "нейросеть бесплатно онлайн",
    "генерация картинок AI",
    "оплатить ChatGPT из России",
    "AI бот Telegram",
    "Stone AI",
    "стоун ай",
  ],
  authors: [{ name: "Stone AI" }],
  creator: "Stone AI",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Stone AI",
    title: "Stone AI — агрегатор 65+ нейросетей без VPN",
    description:
      "65+ нейросетей в одном окне: GPT-5, Claude Opus, Midjourney, Sora. Без VPN, оплата картой РФ. Бесплатный старт + 100₽ на баланс.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Stone AI — AI-студия нового поколения",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
    languages: { "ru": "/" },
    types: {
      "text/markdown": "/llms.txt",
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "PpzANTmpi-gEDEFk0SFPtyDzyTJ93D640gChtmgw10o",
  },
  other: {
    "theme-color": "#FAF9F5",
    "mobile-web-app-capable": "yes",
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Stone AI",
  alternateName: ["StoneAI", "Стоун AI"],
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/og-image.png`,
    width: 1200,
    height: 630,
  },
  description:
    "Российская платформа-агрегатор для доступа к 65+ нейросетям в одном интерфейсе. GPT-5, Claude Opus, Gemini Pro, Midjourney, Kling, Suno и другие. Оплата в рублях через СБП, без VPN.",
  slogan: "Все нейросети в одном месте",
  foundingDate: "2024",
  areaServed: {
    "@type": "Country",
    name: "Russia",
    "@id": "https://www.wikidata.org/wiki/Q159",
  },
  knowsLanguage: ["Russian", "English"],
  knowsAbout: [
    "Искусственный интеллект",
    "Нейронные сети",
    "Large Language Models",
    "Генерация изображений",
    "Генерация видео",
    "Speech-to-text",
    "Text-to-speech",
    "3D-генерация",
    "ChatGPT",
    "Claude",
    "Gemini",
    "Midjourney",
    "DALL-E",
    "Stable Diffusion",
    "Sora",
    "Runway",
    "Kling",
    "Perplexity",
    "DeepSeek",
    "Grok",
    "Llama",
    "Mistral",
    "Qwen",
    "Промпт-инжиниринг",
    "AI-маркетинг",
    "SMM с нейросетями",
  ],
  sameAs: [
    "https://t.me/stonetgbot",
    "https://t.me/StoneAIsupport",
    "https://t.me/stonemvp",
    "https://github.com/Dochstone/stone-ai",
  ],
  founder: {
    "@type": "Person",
    "@id": `${SITE_URL}/authors/dochstone#person`,
    name: "Артём Доченков",
    jobTitle: "Основатель Stone AI",
    url: `${SITE_URL}/authors/dochstone`,
    image: `${SITE_URL}/authors/dochstone.jpg`,
    description:
      "Основатель и идеолог Stone AI. Собрал платформу с 65+ нейросетями, чтобы россияне могли пользоваться AI без VPN и платить картой РФ.",
    sameAs: ["https://t.me/stonemvp"],
    knowsAbout: [
      "Агрегаторы нейросетей",
      "Оплата AI-сервисов из России",
      "Сравнение AI-моделей",
      "Практика использования LLM",
      "Промпт-инжиниринг",
    ],
  },
  foundingLocation: {
    "@type": "Country",
    name: "Russia",
  },
  numberOfEmployees: { "@type": "QuantitativeValue", value: 4 },
  publishingPrinciples: `${SITE_URL}/about`,
  actionableFeedbackPolicy: "https://t.me/StoneAIsupport",
  brand: {
    "@type": "Brand",
    name: "Stone AI",
    logo: `${SITE_URL}/og-image.png`,
  },
  makesOffer: [
    { "@type": "Offer", name: "Free", priceCurrency: "RUB", price: "0" },
    { "@type": "Offer", name: "Start", priceCurrency: "RUB", price: "990", url: `${SITE_URL}/pricing` },
    { "@type": "Offer", name: "Pro", priceCurrency: "RUB", price: "1890", url: `${SITE_URL}/pricing` },
    { "@type": "Offer", name: "Elite", priceCurrency: "RUB", price: "3990", url: `${SITE_URL}/pricing` },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: "https://t.me/StoneAIsupport",
      availableLanguage: ["Russian", "English"],
      areaServed: "RU",
    },
    {
      "@type": "ContactPoint",
      contactType: "technical support",
      url: "https://t.me/StoneAIsupport",
      availableLanguage: "Russian",
    },
  ],
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Stone AI",
  url: SITE_URL,
  inLanguage: "ru",
  publisher: { "@id": `${SITE_URL}/#organization` },
  description:
    `AI-студия нового поколения. Текст, картинки, видео и код. Бесплатный старт. Подписка от ${planPriceFull("mini")}.`,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/models?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

const jsonLdSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#app`,
  name: "Stone AI",
  description:
    "Платформа-агрегатор для работы с 65+ нейросетями через единый интерфейс. Доступ без VPN, оплата в рублях через СБП.",
  operatingSystem: "Web, Android, iOS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "AI Assistant",
  softwareRequirements: "Modern web browser",
  inLanguage: "ru-RU",
  url: SITE_URL,
  downloadUrl: "https://t.me/stonetgbot",
  author: { "@id": `${SITE_URL}/#organization` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  featureList: [
    "65+ AI моделей в одном интерфейсе",
    "Текст, изображения, видео, 3D, аудио, поиск",
    "Оплата в рублях через СБП",
    "Без VPN из России",
    "Telegram-бот и веб-версия",
    "Единая история чатов",
    "Бесплатный пробный период",
  ].join(", "),
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: String(planPriceNum("max-pro")),
    priceCurrency: "RUB",
    offerCount: "4",
    description:
      `Бесплатный старт — 10 запросов/день. Подписки: Start ${planPrice("mini")}, Pro ${planPrice("max")}, Elite ${planPrice("max-pro")} в месяц.`,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "1247",
    bestRating: "5",
    worstRating: "1",
  },
};

const YM_ID = process.env.NEXT_PUBLIC_YM_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d){document.documentElement.classList.add('dark')};var c=d?'#1a1a1e':'#FAF9F5';var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content',c)}else{m=document.createElement('meta');m.name='theme-color';m.content=c;document.head.appendChild(m)}}catch(e){}})()` }} />
        {/* icons, manifest, apple-web-app, theme-color — via Metadata API export above */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdOrganization),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdWebSite),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdSoftware),
          }}
        />

        {/* Service Worker registration */}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}` }} />

        {/* Google Analytics */}
        {GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
              }}
            />
          </>
        )}

        {/* Yandex.Metrika is loaded by <CookieBanner /> after the user grants consent */}
      </head>
      <body>
        {/* Yandex.Metrika noscript */}
        {YM_ID && (
          <noscript>
            <div>
              <img
                src={`https://mc.yandex.ru/watch/${YM_ID}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        )}
        <a href="#main-content" className="skip-link">Перейти к содержанию</a>
        <WebVitals />
        {YM_ID && <script dangerouslySetInnerHTML={{ __html: `window.__ymId=${YM_ID};` }} />}
        <TonProvider>
        <LayoutShell>{children}</LayoutShell>
        </TonProvider>
        {/* ScrollToTop removed — scroll button only in chat */}
        <PWAInstallPrompt />
        <PageTracker />
        <TelegramWebApp />
        <CookieBanner />
      </body>
    </html>
  );
}
