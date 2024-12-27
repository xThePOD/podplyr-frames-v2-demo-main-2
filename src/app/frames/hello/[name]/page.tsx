import { Metadata } from "next";
import App from "../../../app";

const appUrl = process.env.NEXT_PUBLIC_URL;

interface Props {
  params: { name: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = params;

  const frame = {
    version: "vNext",
    image: `${appUrl}/frames/hello/${name}/opengraph-image`,
    buttons: [
      {
        label: "Launch Frame",
        action: "post"
      }
    ]
  };

  return {
    title: `Hello, ${name}`,
    description: `A personalized hello frame for ${name}`,
    openGraph: {
      title: `Hello, ${name}`,
      description: `A personalized hello frame for ${name}`,
    },
    other: {
      "fc:frame": JSON.stringify(frame),
      "fc:frame:image": `${appUrl}/frames/hello/${name}/opengraph-image`,
      "fc:frame:post_url": `${appUrl}/frames/hello/${name}/`,
    },
  };
}

export default function Page({ params }: Props) {
  return <App title={`Hello, ${params.name}`} />;
}
