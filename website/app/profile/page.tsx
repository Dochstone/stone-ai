import type { Metadata } from "next";
import ProfilePage from "@/components/ProfilePage";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Управляйте профилем, балансом и настройками Stone AI.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (<><h1 className="sr-only">Личный кабинет Stone AI</h1><ProfilePage /></>);
}
