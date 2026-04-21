import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TopupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`nav, footer, .scroll-to-top { display: none !important; }`}</style>
      {children}
    </>
  );
}
