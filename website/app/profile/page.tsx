import type { Metadata } from "next";
import ProfilePage from "@/components/ProfilePage";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Управляйте профилем, балансом и настройками Stone AI.",
};

export default function Page() {
  return <ProfilePage />;
}
