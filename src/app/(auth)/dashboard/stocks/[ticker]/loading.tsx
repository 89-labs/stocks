import { Skeleton } from "@/components/ui/skeleton";

export default function StockDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <Skeleton className="h-[200px] rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}
