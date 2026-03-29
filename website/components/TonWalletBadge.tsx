"use client";

import { useTonWallet, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";

export default function TonWalletBadge() {
  const wallet = useTonWallet();
  const address = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();

  if (!wallet) return null;

  const short = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "";

  return (
    <button
      onClick={() => tonConnectUI.openModal()}
      className="hidden md:flex items-center gap-1.5 bg-[#0098EA]/10 text-[#0098EA] px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[#0098EA]/20 transition-colors"
      title={`TON: ${address}`}
    >
      <span className="font-extrabold text-xs">T</span>
      {short}
    </button>
  );
}
