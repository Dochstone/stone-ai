"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isWebchat = pathname === "/dashboard/chat";
  const hideChrome = isDashboard || isWebchat;

  return (
    <>
      {!hideChrome && <Nav />}
      <main id="main-content">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
