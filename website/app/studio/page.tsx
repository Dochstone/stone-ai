import type { Metadata } from "next";
import CreativeChat from "@/components/CreativeChat";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "AI Студия — генерация картинок, видео и 3D моделей",
  description:
    "Генерируйте изображения, видео и 3D модели с помощью AI. Flux, Stable Diffusion, Sora, Runway, Tripo — все в одном интерфейсе.",
  alternates: { canonical: "/studio" },
  openGraph: {
    title: "AI Студия — Stone AI",
    description: "Картинки, видео, 3D — всё из текстового описания. 10+ нейросетей для генерации контента.",
    url: `${SITE_URL}/studio`,
  },
};

export default function StudioPage() {
  return (
    <>
      <h1 className="sr-only">AI Студия — генерация картинок, видео и 3D моделей</h1>
      <CreativeChat />
    </>
  );
}
