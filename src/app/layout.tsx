import type { Metadata } from "next";
import { getSession } from "~/auth";
import "~/app/globals.css";
import { Providers } from "~/app/providers";

export const metadata: Metadata = {
  title: "Audio NFT Player",
  description: "Listen to your audio NFTs in Farcaster",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
      <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
