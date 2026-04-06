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
import TelegramWebApp from "@/components/TelegramWebApp";

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
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AI-студия нового поколения — 65+ моделей, 15 инструментов | Stone AI",
    template: "%s | Stone AI",
  },
  description:
    "Stone AI — AI-студия нового поколения. 65+ моделей, 15 инструментов: чат, картинки, видео, реклама, SEO, презентации, боты и агенты. Создавай, продвигай, автоматизируй. Оплата в рублях.",
  keywords: [
    "AI чат",
    "ChatGPT альтернатива",
    "Claude онлайн",
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
    title: "Stone AI — AI-студия нового поколения",
    description:
      "65+ моделей, 15 инструментов: чат, картинки, видео, реклама, SEO, презентации, боты и агенты. Бесплатный старт + 100₽ на баланс.",
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
    title: "Stone AI — AI-студия нового поколения",
    description:
      "65+ моделей, 15 инструментов: чат, картинки, видео, реклама, SEO, презентации, боты и агенты. Бесплатный старт + 100₽ на баланс.",
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
    "Платформа доступа к 65+ нейросетям через Telegram. GPT-5, Claude Opus, Gemini Pro и другие. Одна подписка вместо пяти.",
  sameAs: ["https://t.me/drifttt55bot", "https://t.me/StoneAIsupport"],
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
    "65+ нейросетей в одном окне. Текст, картинки, видео и код. Бесплатный старт. Подписка от 390₽/мес.",
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
  url: "https://t.me/drifttt55bot",
  downloadUrl: "https://t.me/drifttt55bot",
  author: { "@id": `${SITE_URL}/#organization` },
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "130",
    priceCurrency: "USD",
    offerCount: "50",
    description: "Бесплатный старт — 15 запросов в день. Подписка от 390₽/мес. Free / Start / Pro / Elite.",
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
        <TonProvider>
        <LayoutShell>{children}</LayoutShell>
        </TonProvider>
        <ScrollToTop />
        <PWAInstallPrompt />
        <PageTracker />
        <TelegramWebApp />
      </body>
    </html>
  );
}
