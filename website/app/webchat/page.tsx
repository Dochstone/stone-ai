import type { Metadata } from "next";
import WebChatWrapper from "@/components/WebChatWrapper";

export const metadata: Metadata = {
  title: "AI Чат",
  description: "Чат с 50+ AI-моделями прямо в браузере. GPT-5, Claude Opus, Gemini Pro и другие. Без VPN.",
};

export default function AppPage() {
  return <WebChatWrapper />;
}
