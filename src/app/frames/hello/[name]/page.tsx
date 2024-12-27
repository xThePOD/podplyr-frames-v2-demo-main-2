import App from "../../../app";

type PageProps = {
  params: {
    name: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
};

export default function Page(props: PageProps) {
  return <App title={`Hello, ${props.params.name}`} />;
}
