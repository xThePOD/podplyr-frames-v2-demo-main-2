"use client";

import Provider from "~/components/providers/WagmiProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
    </Provider>
  );
}
