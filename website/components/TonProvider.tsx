"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode, useEffect, useState } from "react";

export default function TonProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <TonConnectUIProvider
      manifestUrl="https://stoneai.ru/tonconnect-manifest.json"
      actionsConfiguration={{
        twaReturnUrl: "https://stoneai.ru/pricing",
      }}
      uiPreferences={{
        theme: "SYSTEM",
      }}
      walletsListConfiguration={{
        includeWallets: [
          {
            appName: "tonkeeper",
            name: "Tonkeeper",
            imageUrl: "https://tonkeeper.com/assets/tonconnect-icon.png",
            aboutUrl: "https://tonkeeper.com",
            universalLink: "https://app.tonkeeper.com/ton-connect",
            bridgeUrl: "https://bridge.tonapi.io/bridge",
            platforms: ["ios", "android", "chrome", "firefox", "macos", "windows", "linux"],
          },
          {
            appName: "mytonwallet",
            name: "MyTonWallet",
            imageUrl: "https://static.mytonwallet.io/icon-256.png",
            aboutUrl: "https://mytonwallet.io",
            universalLink: "https://connect.mytonwallet.org",
            bridgeUrl: "https://tonconnectbridge.mytonwallet.org/bridge",
            platforms: ["chrome", "windows", "macos", "linux", "ios", "android"],
          },
        ],
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
