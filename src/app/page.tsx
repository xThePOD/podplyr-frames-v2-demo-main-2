import { Metadata } from "next";
import App from "./app";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "vNext",
  imageUrl: `${appUrl}/opengraph-image`,
  buttons: [
    {
      label: "Connect",
      action: "post"
    },
    {
      label: "View NFTs",
      action: "post"
    }
  ],
  postUrl: appUrl
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Audio NFT Player",
    openGraph: {
      title: "Audio NFT Player",
      description: "Listen to your audio NFTs in Farcaster",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
      "fc:frame:image": `${appUrl}/opengraph-image`,
      "fc:frame:button:1": "Connect",
      "fc:frame:button:2": "View NFTs",
    },
  };
}

export default function Home() {
  return (<App />);
}
