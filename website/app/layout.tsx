import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import WebVitals from "@/components/WebVitals";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

import { SITE_URL } from "@/lib/constants";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "50+ AI-моделей и нейросетей без VPN — чат с GPT-5, Claude, Gemini | Stone AI",
    template: "%s | Stone AI",
  },
  description:
    "GPT-5, Claude Opus, Gemini Pro и ещё 47 нейросетей в одном чате. Бот в Telegram без VPN. Оплата за токены — от $0.004 за запрос. Попробуйте бесплатно — 15 запросов в день.",
  keywords: [
    "AI чат",
    "ChatGPT без VPN",
    "ChatGPT альтернатива",
    "Claude без VPN",
    "нейросеть онлайн",
    "нейросеть бесплатно",
    "AI бот Telegram",
    "GPT на русском",
    "GPT-5",
    "Claude Opus",
    "Gemini Pro",
    "искусственный интеллект",
    "ИИ чат",
    "генерация картинок AI",
    "Stone AI",
  ],
  authors: [{ name: "Stone AI" }],
  creator: "Stone AI",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Stone AI",
    title: "50+ AI-моделей и нейросетей без VPN — Stone AI",
    description:
      "GPT-5, Claude Opus, Gemini Pro и ещё 47 нейросетей в одном чате. Бот в Telegram без VPN. Оплата за токены — от $0.004 за запрос. 15 бесплатных запросов в день.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Stone AI — 50 AI-моделей без VPN, прямо в Telegram",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "50+ AI-моделей и нейросетей без VPN — Stone AI",
    description:
      "GPT-5, Claude Opus, Gemini Pro и ещё 47 нейросетей в одном чате. Бот в Telegram без VPN. Оплата за токены — от $0.004 за запрос. 15 бесплатных запросов в день.",
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
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  other: {
    "theme-color": "#C4623D",
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Stone AI",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/og-image.png`,
    width: 1200,
    height: 630,
  },
  description:
    "Платформа доступа к 50+ AI-моделям через Telegram. GPT-5, Claude Opus, Gemini Pro и другие. Без VPN, без подписок.",
  sameAs: ["https://t.me/StoneAIBot", "https://t.me/StoneAIsupport"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: "https://t.me/StoneAIsupport",
    availableLanguage: "Russian",
  },
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
    "50+ AI-моделей и нейросетей без VPN, прямо в Telegram. Платите только за использованные токены.",
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
  operatingSystem: "Android, iOS, Web",
  applicationCategory: "BusinessApplication",
  url: "https://t.me/StoneAIBot",
  downloadUrl: "https://t.me/StoneAIBot",
  author: { "@id": `${SITE_URL}/#organization` },
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "130",
    priceCurrency: "USD",
    offerCount: "50",
    description: "15 бесплатных запросов в день. 50+ платных моделей от $0.24 за 1M токенов.",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()` }} />
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

        {/* Yandex.Metrika */}
        {YM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${YM_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`,
            }}
          />
        )}
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
        <Nav />
        <main id="main-content">{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
