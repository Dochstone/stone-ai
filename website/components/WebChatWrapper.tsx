"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import WebChat from "@/components/WebChat";

function WebChatInner() {
  const searchParams = useSearchParams();
  const modelParam = searchParams.get("model") || undefined;
  const categoryParam = searchParams.get("category") || undefined;

  return <WebChat initialModel={modelParam} initialCategory={categoryParam} />;
}

export default function WebChatWrapper() {
  return (
    <Suspense fallback={null}>
      <WebChatInner />
    </Suspense>
  );
}
