import { Suspense } from "react";
import { VendorDetailScreen } from "@/src/screens/Vendors/VendorDetailScreen";
import { parseRangeQuery } from "@/src/utils/period";

async function VendorDetailLoader({ params, searchParams }: PageProps<"/vendors/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // ?from=2026-11-01&to=2026-11-16 — carried over from the filtered Vendors list.
  return <VendorDetailScreen id={id} initialRange={parseRangeQuery(query.from, query.to)} />;
}

export default function Page({ params, searchParams }: PageProps<"/vendors/[id]">) {
  return (
    <Suspense fallback={null}>
      <VendorDetailLoader params={params} searchParams={searchParams} />
    </Suspense>
  );
}
