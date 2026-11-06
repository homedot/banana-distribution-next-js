import { Suspense } from "react";
import { DistributionDetailScreen } from "@/src/screens/Distributions/DistributionDetailScreen";

async function DistributionDetailLoader({
  params,
}: Pick<PageProps<"/distributions/[id]">, "params">) {
  const { id } = await params;
  return <DistributionDetailScreen id={id} />;
}

export default function Page({ params }: PageProps<"/distributions/[id]">) {
  return (
    <Suspense fallback={null}>
      <DistributionDetailLoader params={params} />
    </Suspense>
  );
}
