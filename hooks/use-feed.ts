"use client";

import { useState, useCallback, useEffect } from "react";

interface TweetItem {
  tweet_id: string;
  tweet_url: string;
  vendor: string;
  published_at: string;
}

interface FeedResponse {
  items: TweetItem[];
  nextCursor: string | null;
}

interface UseFeedOptions {
  vendor: string;
  date: string | null;
  windowHours: number;
}

export function useFeed({ vendor, date, windowHours }: UseFeedOptions) {
  const [items, setItems] = useState<TweetItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Build query URL
  const buildUrl = useCallback(
    (cursorParam?: string | null) => {
      const params = new URLSearchParams();
      
      if (date) {
        params.set("mode", "date");
        params.set("date", date);
      } else {
        params.set("mode", "timeline");
        params.set("windowHours", String(windowHours));
      }
      
      params.set("vendor", vendor);
      params.set("limit", "10");
      
      if (cursorParam) {
        params.set("cursor", cursorParam);
      }
      
      return `/api/feed?${params.toString()}`;
    },
    [vendor, date, windowHours]
  );

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setItems([]);
    setCursor(null);
    setHasMore(true);

    try {
      const response = await fetch(buildUrl());
      if (!response.ok) throw new Error("Failed to fetch");
      
      const data: FeedResponse = await response.json();
      setItems(data.items);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [buildUrl]);

  // Load more data
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !cursor) return;

    setIsLoadingMore(true);

    try {
      const response = await fetch(buildUrl(cursor));
      if (!response.ok) throw new Error("Failed to fetch");
      
      const data: FeedResponse = await response.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Error loading more:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [buildUrl, cursor, hasMore, isLoadingMore]);

  // Refetch when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch: fetchData,
  };
}



