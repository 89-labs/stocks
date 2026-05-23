import { cn } from "@/lib/utils";
import { Card } from "./card";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export function StockTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function NewsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}

/** @deprecated Use NewsGridSkeleton */
export const NewsTableSkeleton = NewsGridSkeleton;

export function CardSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="mb-4 h-6 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </Card>
  );
}

export function ChartSkeleton() {
  return <Skeleton className="h-80 w-full rounded-xl" />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}
