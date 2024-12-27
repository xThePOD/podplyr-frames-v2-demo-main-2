import App from "../../../app";

interface Props {
  params: { name: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params }: Props) {
  const { name } = params;
  return <App title={`Hello, ${name}`} />;
}
