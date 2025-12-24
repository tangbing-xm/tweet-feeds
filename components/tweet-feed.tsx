"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { TweetEmbed } from "./tweet-embed";

interface TweetItem {
  tweet_id: string;
  tweet_url: string;
  vendor: string;
  published_at: string;
}

interface TweetFeedProps {
  items: TweetItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  className?: string;
}

// Group tweets by date (Beijing timezone)
function groupByDate(items: TweetItem[]): Map<string, TweetItem[]> {
  const groups = new Map<string, TweetItem[]>();
  
  for (const item of items) {
    // Convert to Beijing timezone date
    const date = new Date(item.published_at);
    const beijingDate = date.toLocaleDateString("en-CA", {
      timeZone: "Asia/Shanghai",
    }); // YYYY-MM-DD format
    
    if (!groups.has(beijingDate)) {
      groups.set(beijingDate, []);
    }
    groups.get(beijingDate)!.push(item);
  }
  
  return groups;
}

// Format date for display - always show YYYY/MM/DD format
function formatDateHeading(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}/${month}/${day}`;
}

export function TweetFeed({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  className,
}: TweetFeedProps) {
  const { t } = useI18n();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Group tweets by date
  const groupedTweets = useMemo(() => groupByDate(items), [items]);
  const dateKeys = useMemo(
    () => Array.from(groupedTweets.keys()).sort((a, b) => b.localeCompare(a)),
    [groupedTweets]
  );

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const root =
      (loadMoreRef.current?.closest(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLElement | null) ?? null;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root,
      rootMargin: "200px",
      threshold: 0,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Initial loading state
  if (isLoading && items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-20", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">{t("feed.loading")}</p>
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-20", className)}>
        <p className="text-muted-foreground">{t("feed.noTweets")}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {dateKeys.map((dateKey) => (
        <section key={dateKey}>
          {/* Date Heading */}
          <div className="sticky top-0 z-10 py-2 bg-background/95 backdrop-blur-xl border-b border-border/50">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold tracking-tight">
                {formatDateHeading(dateKey)}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>
          </div>

          {/* Tweets for this date - masonry layout with CSS columns */}
          <div className="pt-3 columns-1 lg:columns-2 gap-3">
            {groupedTweets.get(dateKey)?.map((tweet) => (
              <div key={tweet.tweet_id} className="break-inside-avoid mb-3">
                <TweetEmbed tweetUrl={tweet.tweet_url} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-8">
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t("feed.loadingMore")}</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {t("feed.endOfFeed")}
          </p>
        )}
      </div>
    </div>
  );
}
