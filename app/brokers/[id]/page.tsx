import { Suspense } from "react";
import { BrokerDetailScreen } from "@/src/screens/Brokers/BrokerDetailScreen";

async function BrokerDetailLoader({
  params,
}: Pick<PageProps<"/brokers/[id]">, "params">) {
  const { id } = await params;
  return <BrokerDetailScreen id={id} />;
}

export default function Page({ params }: PageProps<"/brokers/[id]">) {
  return (
    <Suspense fallback={null}>
      <BrokerDetailLoader params={params} />
    </Suspense>
  );
}
