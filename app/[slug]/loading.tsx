import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6 pt-2" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-72 rounded-[24px]" />
        <Skeleton className="h-72 rounded-[24px]" />
      </div>
      <Skeleton className="h-40 rounded-[24px]" />
    </div>
  );
}
