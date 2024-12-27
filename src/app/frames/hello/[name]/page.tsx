import App from "../../../app";

type Props = {
  params: {
    name: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function Page(props: Props) {
  const { name } = props.params;
  return <App title={`Hello, ${name}`} />;
}
