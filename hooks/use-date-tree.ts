"use client";

import { useState, useEffect } from "react";

interface DateNode {
  year: number;
  months: {
    month: number;
    days: number[];
  }[];
}

type DatesResponse = {
  items: Array<{ date: string; tweet_count: number }>;
};

// Cache configuration
const CACHE_KEY = "ai-vendor-feed-dates";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes client-side cache

interface CachedData {
  dates: string[];
  timestamp: number;
}

function getCachedDates(): string[] | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - data.timestamp < CACHE_TTL_MS) {
      return data.dates;
    }
    
    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedDates(dates: string[]): void {
  if (typeof window === "undefined") return;
  
  try {
    const data: CachedData = {
      dates,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded)
  }
}

function buildDateTreeFromDates(dates: string[]): DateNode[] {
  const grouped = new Map<number, Map<number, Set<number>>>();

  for (const dateStr of dates) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!m) continue;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);

    if (!grouped.has(year)) grouped.set(year, new Map());
    const months = grouped.get(year)!;
    if (!months.has(month)) months.set(month, new Set());
    months.get(month)!.add(day);
  }

  return [...grouped.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, days]) => ({
          month,
          days: [...days.values()].sort((a, b) => b - a),
        })),
    }));
}

export function useDateTree() {
  const [dateTree, setDateTree] = useState<DateNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Try to use cached data first
      const cached = getCachedDates();
      if (cached && cached.length > 0) {
        const tree = buildDateTreeFromDates(cached);
        if (!cancelled) {
          setDateTree(tree);
          setIsLoading(false);
        }
        return;
      }

      // Fetch from API if no cache
      try {
        const res = await fetch("/api/dates?limit=240");
        if (!res.ok) throw new Error("Failed to load dates");
        const json = (await res.json()) as DatesResponse;
        const dates = (json.items ?? []).map((i) => i.date);
        
        // Cache the result
        setCachedDates(dates);
        
        const tree = buildDateTreeFromDates(dates);
        if (!cancelled) setDateTree(tree);
      } catch {
        if (!cancelled) setDateTree([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { dateTree, isLoading };
}
