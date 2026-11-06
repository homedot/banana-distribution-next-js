import { Suspense } from "react";
import { CreateDistributionScreen } from "@/src/screens/Distributions/wizard/CreateDistributionScreen";

async function EditDistributionLoader({
  params,
}: Pick<PageProps<"/distributions/[id]/edit">, "params">) {
  const { id } = await params;
  return <CreateDistributionScreen distributionId={id} />;
}

export default function Page({ params }: PageProps<"/distributions/[id]/edit">) {
  return (
    <Suspense fallback={null}>
      <EditDistributionLoader params={params} />
    </Suspense>
  );
}
