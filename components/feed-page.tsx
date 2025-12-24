"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-filter";
import { TweetFeed } from "@/components/tweet-feed";
import { BackToTop } from "@/components/back-to-top";
import { useFeed } from "@/hooks/use-feed";
import { useDateTree } from "@/hooks/use-date-tree";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State from URL params
  const [selectedVendor, setSelectedVendor] = useState(
    searchParams.get("vendor") ?? "all"
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    searchParams.get("date")
  );
  
  // Detect mobile
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Window hours: 48h for mobile, 72h for desktop
  const windowHours = isMobile ? 48 : 72;
  // Fewer initial tweets to reduce main-thread & LCP pressure
  const pageSize = isMobile ? 4 : 6;

  // Date tree for sidebar
  const { dateTree } = useDateTree();

  // Feed data
  const {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useFeed({
    vendor: selectedVendor,
    date: selectedDate,
    windowHours,
    limit: pageSize,
  });

  // Update URL when filters change
  const updateUrl = (vendor: string, date: string | null) => {
    const params = new URLSearchParams();
    if (vendor !== "all") params.set("vendor", vendor);
    if (date) params.set("date", date);
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/", { scroll: false });
  };

  const handleVendorChange = (vendor: string) => {
    setSelectedVendor(vendor);
    updateUrl(vendor, selectedDate);
  };

  const handleDateChange = (date: string | null) => {
    setSelectedDate(date);
    updateUrl(selectedVendor, date);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Sidebar */}
        <Sidebar
          selectedVendor={selectedVendor}
          onVendorChange={handleVendorChange}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          dateTree={dateTree}
          className="w-72 shrink-0"
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-5xl mx-auto px-4 py-6">
              <TweetFeed
                items={items}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
              />
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile Header */}
        <MobileHeader
          selectedVendor={selectedVendor}
          onVendorChange={handleVendorChange}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          dateTree={dateTree}
        />

        {/* Feed */}
        <main className="flex-1 px-4 py-4">
          <TweetFeed
            items={items}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        </main>
      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
}

