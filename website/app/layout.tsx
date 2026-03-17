import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const SITE_URL = "https://website-production-907e.up.railway.app";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stone AI — 50 AI-моделей без VPN",
    template: "%s | Stone AI",
  },
  description:
    "GPT-5, Claude Opus, Gemini Pro и ещё 47 моделей прямо в Telegram. Платите только за использованные токены. Без VPN, без подписок.",
  keywords: [
    "AI чат",
    "ChatGPT без VPN",
    "Claude без VPN",
    "AI модели Telegram",
    "GPT-5",
    "Claude Opus",
    "Gemini Pro",
    "нейросеть Telegram",
    "AI бот",
    "генерация картинок AI",
    "per-token оплата",
    "Stone AI",
  ],
  authors: [{ name: "Stone AI" }],
  creator: "Stone AI",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "Stone AI",
    title: "Stone AI — 50 AI-моделей без VPN",
    description:
      "GPT-5, Claude Opus, Gemini Pro и ещё 47 моделей прямо в Telegram. Платите только за использованные токены.",
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
    title: "Stone AI — 50 AI-моделей без VPN",
    description:
      "GPT-5, Claude Opus, Gemini Pro и ещё 47 моделей прямо в Telegram. Платите только за токены.",
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
    canonical: SITE_URL,
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Stone AI",
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  description:
    "Платформа доступа к 50+ AI-моделям через Telegram. GPT-5, Claude Opus, Gemini Pro и другие. Без VPN, без подписок.",
  sameAs: ["https://t.me/StoneAIBot", "https://t.me/StoneAIsupport"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: "https://t.me/StoneAIsupport",
  },
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Stone AI",
  url: SITE_URL,
  description:
    "50 AI-моделей без VPN, прямо в Telegram. Платите только за использованные токены.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/models?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const jsonLdSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Stone AI",
  operatingSystem: "Telegram",
  applicationCategory: "UtilitiesApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "10 бесплатных запросов в день. Платные модели от $0.24 за 1M токенов.",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={manrope.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
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
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
