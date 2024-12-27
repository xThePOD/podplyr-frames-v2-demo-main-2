import { Metadata } from "next";
import App from "../../../app";

interface Props {
  params: { name: string };
}

export default async function Page({ params }: Props) {
  const { name } = await params;

  return <App title={`Hello, ${name}`} />;
}
