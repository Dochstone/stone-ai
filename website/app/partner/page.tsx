import type { Metadata } from "next";
import PartnerDashboard from "@/components/PartnerDashboard";

export const metadata: Metadata = {
  title: "Partner Dashboard — Stone AI",
  description: "Partner dashboard: track referrals, deposits, earnings and generate UTM links.",
  robots: { index: false, follow: false },
};

export default function PartnerPage() {
  return <PartnerDashboard />;
}
