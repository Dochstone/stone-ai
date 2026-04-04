import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Чат — 65+ нейросетей в одном окне",
  description: "Чат с 65+ нейросетями прямо в браузере. GPT-5, Claude Opus, Gemini Pro и другие. 15 бесплатных запросов в день.",
};

export default function WebChatPage() {
  redirect("/dashboard/chat");
}
