"use client";

import { useTonWallet, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";

export default function TonWalletProfile() {
  const wallet = useTonWallet();
  const address = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();

  const shortAddr = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "";

  return (
    <div className="flex items-center justify-between py-2 border-t border-text/[0.04]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#0098EA]/10 rounded-lg flex items-center justify-center">
          <span className="text-sm font-extrabold text-[#0098EA]">T</span>
        </div>
        <div>
          <div className="text-sm font-medium text-text">TON Кошелёк</div>
          <div className="text-[11px] text-text/30">
            {wallet ? shortAddr : "Не подключён"}
          </div>
        </div>
      </div>
      {wallet ? (
        <button
          onClick={() => tonConnectUI.disconnect()}
          className="text-xs font-semibold text-red-500 hover:underline"
        >
          Отключить
        </button>
      ) : (
        <button
          onClick={() => tonConnectUI.openModal()}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Подключить
        </button>
      )}
    </div>
  );
}
