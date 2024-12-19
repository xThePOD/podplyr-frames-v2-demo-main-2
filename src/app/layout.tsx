import type { Metadata } from "next";

import "~/app/globals.css";
import { Providers } from "~/app/providers";

export const metadata: Metadata = {
  title: "Audio NFT Player",
  description: "Listen to your audio NFTs in Farcaster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${process.env.NEXT_PUBLIC_URL}/og-image.png`} />
        <meta property="fc:frame:button:1" content="Connect" />
        <meta property="fc:frame:button:2" content="View NFTs" />
        <meta property="og:title" content="Audio NFT Player" />
        <meta property="og:description" content="Listen to your audio NFTs" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
