import App from "../../../app";

interface PageParams {
  name: string;
}

interface Props {
  params: PageParams;
}

export default async function Page({ params }: Props) {
  return <App title={`Hello, ${params.name}`} />;
}
