import { Suspense } from "react";
import { FeedPage } from "@/components/feed-page";
import { Skeleton } from "@/components/ui/skeleton";

// Loading fallback
function PageLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:flex h-screen">
        {/* Sidebar skeleton */}
        <div className="w-72 shrink-0 border-r border-border p-6 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 p-8 max-w-2xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <FeedPage />
    </Suspense>
  );
}
