import { Suspense } from "react";
import { VendorDetailScreen } from "@/src/screens/Vendors/VendorDetailScreen";

async function VendorDetailLoader({
  params,
}: Pick<PageProps<"/vendors/[id]">, "params">) {
  const { id } = await params;
  return <VendorDetailScreen id={id} />;
}

export default function Page({ params }: PageProps<"/vendors/[id]">) {
  return (
    <Suspense fallback={null}>
      <VendorDetailLoader params={params} />
    </Suspense>
  );
}
