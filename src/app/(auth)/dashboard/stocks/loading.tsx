import { Skeleton } from "@/components/ui/skeleton";

export default function StocksLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <Skeleton className="h-[200px] rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
