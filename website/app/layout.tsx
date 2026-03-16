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

export const metadata: Metadata = {
  title: "Stone AI — 50 AI-моделей без VPN",
  description:
    "GPT-5, Claude Opus, Gemini Pro и ещё 47 моделей прямо в Telegram. Платите только за использованные токены. Без VPN, без подписок.",
  openGraph: {
    title: "Stone AI — 50 AI-моделей без VPN",
    description:
      "GPT-5, Claude Opus, Gemini Pro и ещё 47 моделей прямо в Telegram. Платите только за использованные токены.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
