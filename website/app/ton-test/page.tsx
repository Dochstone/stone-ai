"use client";

import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";

export default function TonTestPage() {
  const wallet = useTonWallet();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold">TON Connect Test</h1>

      <TonConnectButton />

      <div className="bg-bg rounded-xl p-6 max-w-md w-full text-sm space-y-2">
        <p><b>Connected:</b> {wallet ? "YES" : "NO"}</p>
        {wallet && (
          <>
            <p><b>Address:</b> {wallet.account.address}</p>
            <p><b>Chain:</b> {wallet.account.chain}</p>
            <p><b>Wallet:</b> {wallet.device.appName}</p>
          </>
        )}
      </div>

      <p className="text-text/40 text-xs max-w-md text-center">
        Нажмите кнопку выше, подключите кошелёк, и посмотрите обновится ли статус.
        Не закрывайте эту страницу при подключении.
      </p>
    </div>
  );
}
