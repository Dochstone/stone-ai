import type { Metadata } from "next";
import WebChatWrapper from "@/components/WebChatWrapper";

export const metadata: Metadata = {
  title: "AI Чат",
  description: "Чат с 65+ нейросетями прямо в браузере. GPT-5, Claude Opus, Gemini Pro и другие.",
};

export default function AppPage() {
  return <WebChatWrapper />;
}
