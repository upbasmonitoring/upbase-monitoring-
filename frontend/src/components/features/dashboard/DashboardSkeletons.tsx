import { Skeleton } from "@/components/ui/skeleton";

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="glass-card p-5 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-card p-6 h-[350px] space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
    <Skeleton className="h-[200px] w-full rounded-lg" />
  </div>
);

export const TableSkeleton = () => (
  <div className="glass-card p-6 space-y-6">
    <Skeleton className="h-6 w-40" />
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex justify-between items-center py-2 border-b border-border/10">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const InsightsSkeleton = () => (
  <div className="glass-card p-6 space-y-6">
    <div className="flex justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  </div>
);
