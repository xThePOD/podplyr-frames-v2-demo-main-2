import App from "../../../app";

export default function Page({
  params,
}: {
  params: { name: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Simple validation
  if (!params?.name) {
    return null;
  }

  return <App title={`Hello, ${params.name}`} />;
}
