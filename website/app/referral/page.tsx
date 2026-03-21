import type { Metadata } from "next";
import ReferralPage from "@/components/ReferralPage";

export const metadata: Metadata = {
  title: "Реферальная программа",
  description: "Приглашайте друзей в Stone AI и получайте 10% от их пополнений на свой баланс.",
};

export default function Page() {
  return <ReferralPage />;
}
