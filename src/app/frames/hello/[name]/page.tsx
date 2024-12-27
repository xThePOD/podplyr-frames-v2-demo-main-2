import App from "../../../app";

type PageProps = {
  params: {
    name: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function Page({ params }: PageProps) {
  return <App title={`Hello, ${params.name}`} />;
}
