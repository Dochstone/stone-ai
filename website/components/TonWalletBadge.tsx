"use client";

import { useTonWallet, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useState, useEffect, useRef } from "react";

export default function TonWalletBadge() {
  const wallet = useTonWallet();
  const address = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!wallet) return null;

  const short = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "";
  const walletName = wallet.device?.appName || "TON Wallet";

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-[#0098EA]/10 text-[#0098EA] px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[#0098EA]/20 transition-colors"
      >
        <span className="font-extrabold text-xs">T</span>
        {short}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-text/10 shadow-xl shadow-black/5 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-text/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#0098EA] rounded-lg flex items-center justify-center">
                <span className="text-white font-extrabold text-[10px]">T</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text truncate">{walletName}</p>
                <p className="text-[10px] text-text/30 truncate">{address}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => { copyAddress(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text/70 hover:bg-bg transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-text/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              Копировать адрес
            </button>

            <a
              href={`https://tonviewer.com/${address}`}
              target="_blank"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text/70 hover:bg-bg transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-text/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Открыть в Tonviewer
            </a>

            <a
              href="/pricing"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text/70 hover:bg-bg transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-text/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              Оплатить подписку
            </a>
          </div>

          {/* Disconnect */}
          <div className="border-t border-text/5 py-1">
            <button
              onClick={() => { tonConnectUI.disconnect(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Отключить кошелёк
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
