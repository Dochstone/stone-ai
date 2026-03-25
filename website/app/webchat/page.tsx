import type { Metadata } from "next";
import WebChatWrapper from "@/components/WebChatWrapper";

export const metadata: Metadata = {
  title: "AI Чат — 65+ нейросетей в одном окне",
  description: "Чат с 65+ нейросетями прямо в браузере. GPT-5, Claude Opus, Gemini Pro и другие. 15 бесплатных запросов в день.",
};

export default function AppPage() {
  return (
    <>
      <h1 className="sr-only">AI Чат — 65+ нейросетей в одном окне</h1>
      <WebChatWrapper />
    </>
  );
}
