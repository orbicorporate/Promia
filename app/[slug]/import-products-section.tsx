"use client";

import { useRouter } from "next/navigation";
import { ImportProducts } from "./import-products";

export function ImportProductsSection({ marketId }: { marketId: string }) {
  const router = useRouter();
  return <ImportProducts marketId={marketId} onImported={() => router.refresh()} />;
}
