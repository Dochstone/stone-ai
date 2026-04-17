"use client";

import { ComponentType, ReactNode, useEffect, useState } from "react";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

export default function TonProviderLazy({ children }: { children: ReactNode }) {
  const [TonProvider, setTonProvider] = useState<ProviderComponent | null>(null);

  useEffect(() => {
    import("./TonProvider").then((m) => setTonProvider(() => m.default));
  }, []);

  if (!TonProvider) return <>{children}</>;
  return <TonProvider>{children}</TonProvider>;
}
