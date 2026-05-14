import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import ScrollToTop from "@/components/ScrollToTop";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
// WelcomeBonusBanner moved inside Nav to fix z-index overlap
import WebVitals from "@/components/WebVitals";
import TonProvider from "@/components/TonProviderLazy";
import PageTracker from "@/components/PageTracker";
import CookieBanner from "@/components/CookieBanner";
import TelegramWebApp from "@/components/TelegramWebApp";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

import { SITE_URL, SITE_RATING } from "@/lib/constants";
import { planPrice, planPriceFull, planPriceNum } from "@/lib/pricing";
const OG_IMAGE = `${SITE_URL}/opengraph-image?v=2`;

export function generateViewport(): Viewport {
  const theme = cookies().get("theme")?.value;
  return {
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    themeColor: theme === "dark" ? "#1a1a1e" : "#FAF9F5",
  };
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stone AI — агрегатор 65+ нейросетей в одном чате без VPN",
    template: "%s | Stone AI",
  },
  description:
    "Stone AI — агрегатор 65+ нейросетей: GPT-5, Claude, Midjourney и Sora в одном чате. Без VPN, оплата рублями.",
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
    title: "Stone AI — агрегатор 65+ нейросетей в одном чате без VPN",
    description:
      "Stone AI — агрегатор 65+ нейросетей: GPT-5, Claude, Midjourney и Sora в одном чате. Без VPN, оплата рублями.",
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
    url: `${SITE_URL}/opengraph-image?v=2`,
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
    logo: `${SITE_URL}/opengraph-image?v=2`,
  },
  makesOffer: [
    { "@type": "Offer", name: "Free", priceCurrency: "RUB", price: "0" },
    { "@type": "Offer", name: "Start", priceCurrency: "RUB", price: "990", url: `${SITE_URL}/pricing` },
    { "@type": "Offer", name: "Pro", priceCurrency: "RUB", price: "1690", url: `${SITE_URL}/pricing` },
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
    ratingValue: SITE_RATING.value,
    reviewCount: SITE_RATING.count,
    bestRating: SITE_RATING.best,
    worstRating: SITE_RATING.worst,
  },
};

const YM_ID = process.env.NEXT_PUBLIC_YM_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeCookie = cookies().get("theme")?.value;
  const htmlClass = `${manrope.variable}${themeCookie === "dark" ? " dark" : ""}`;
  return (
    <html lang="ru" className={htmlClass} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d){document.documentElement.classList.add('dark')};var v=d?'dark':'light';if(!document.cookie.split('; ').some(function(c){return c.indexOf('theme=')===0})){document.cookie='theme='+v+'; path=/; max-age=31536000; SameSite=Lax'}var c=d?'#1a1a1e':'#FAF9F5';var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content',c)}else{m=document.createElement('meta');m.name='theme-color';m.content=c;document.head.appendChild(m)}}catch(e){}})()` }} />
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

        {/* Unregister any previously installed service worker + wipe its caches.
            Stone AI is a cloud-only tool, offline support caused stale-cache bugs. */}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})});if(typeof caches!=='undefined'){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})})}}` }} />

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
                alt="Yandex Metrika"
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
