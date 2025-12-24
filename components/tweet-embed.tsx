"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TweetEmbedProps {
  tweetUrl: string;
  className?: string;
}

// Declare Twitter widgets type
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => Promise<void>;
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

export function TweetEmbed({ tweetUrl, className }: TweetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Extract tweet ID from URL
  const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];

  useEffect(() => {
    if (!tweetId || !containerRef.current) return;

    const container = containerRef.current;
    
    const loadTweet = async () => {
      // Wait for Twitter widgets to be ready
      if (!window.twttr?.widgets) {
        // Retry after script loads
        const checkInterval = setInterval(() => {
          if (window.twttr?.widgets) {
            clearInterval(checkInterval);
            renderTweet();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.twttr?.widgets) {
            setError(true);
            setIsLoading(false);
          }
        }, 5000);
        return;
      }
      
      renderTweet();
    };

    const renderTweet = async () => {
      if (!window.twttr?.widgets || !container) return;
      
      try {
        // Clear container
        container.innerHTML = "";
        
        const tweet = await window.twttr.widgets.createTweet(tweetId, container, {
          theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
          dnt: true, // Do not track
          align: "center",
        });
        
        if (tweet) {
          setIsLoading(false);
        } else {
          setError(true);
          setIsLoading(false);
        }
      } catch {
        setError(true);
        setIsLoading(false);
      }
    };

    loadTweet();
  }, [tweetId]);

  // Re-render on theme change
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (containerRef.current && window.twttr?.widgets && !isLoading && !error) {
        // Re-create tweet with new theme
        containerRef.current.innerHTML = "";
        setIsLoading(true);
        
        if (tweetId) {
          window.twttr.widgets.createTweet(tweetId, containerRef.current, {
            theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
            dnt: true,
            align: "center",
          }).then((tweet) => {
            if (tweet) {
              setIsLoading(false);
            }
          });
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [tweetId, isLoading, error]);

  if (!tweetId) {
    return null;
  }

  return (
    <div className={cn("relative min-h-[120px]", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-[550px] space-y-4 p-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
          >
            View tweet on X →
          </a>
        </div>
      )}
      
      <div
        ref={containerRef}
        className={cn(
          "tweet-container flex justify-center",
          isLoading && "opacity-0",
          error && "hidden"
        )}
      />
    </div>
  );
}

