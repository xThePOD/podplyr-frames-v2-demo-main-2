import App from "../../../app";

export default function Page({
  params,
}: {
  params: { name: string };
}) {
  return <App title={`Hello, ${params.name}`} />;
}
