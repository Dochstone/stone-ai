"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

export default function TonProvider({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl="https://stoneai.ru/tonconnect-manifest.json"
      actionsConfiguration={{
        twaReturnUrl: "https://stoneai.ru/pricing",
        returnStrategy: "back",
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
