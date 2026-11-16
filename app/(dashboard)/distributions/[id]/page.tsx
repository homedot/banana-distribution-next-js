import { Suspense } from "react";
import { SaleDetailScreen } from "@/src/screens/Sales/SaleDetailScreen";

async function SaleDetailLoader({
  params,
}: Pick<PageProps<"/distributions/[id]">, "params">) {
  const { id } = await params;
  return <SaleDetailScreen id={id} />;
}

export default function Page({ params }: PageProps<"/distributions/[id]">) {
  return (
    <Suspense fallback={null}>
      <SaleDetailLoader params={params} />
    </Suspense>
  );
}
