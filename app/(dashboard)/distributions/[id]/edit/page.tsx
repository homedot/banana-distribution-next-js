import { Suspense } from "react";
import { CreateSaleScreen } from "@/src/screens/Sales/wizard/CreateSaleScreen";

async function EditSaleLoader({
  params,
}: Pick<PageProps<"/distributions/[id]/edit">, "params">) {
  const { id } = await params;
  return <CreateSaleScreen saleId={id} />;
}

export default function Page({ params }: PageProps<"/distributions/[id]/edit">) {
  return (
    <Suspense fallback={null}>
      <EditSaleLoader params={params} />
    </Suspense>
  );
}
