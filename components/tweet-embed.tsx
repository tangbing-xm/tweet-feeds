"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(false);
  const currentThemeRef = useRef<string>("");

  // Extract tweet ID from URL
  const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];

  // Get current theme
  const getTheme = useCallback(() => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }, []);

  // Render tweet with specified theme
  const renderTweet = useCallback(async (container: HTMLElement, theme: string, isThemeChange = false) => {
    if (!window.twttr?.widgets || !tweetId) return;

    try {
      if (isThemeChange) {
        setIsTransitioning(true);
      }

      // Create a temporary container for the new tweet
      const tempContainer = document.createElement("div");
      tempContainer.style.opacity = "0";
      tempContainer.style.transition = "opacity 200ms ease-in-out";
      container.appendChild(tempContainer);

      const tweet = await window.twttr.widgets.createTweet(tweetId, tempContainer, {
        theme,
        dnt: true,
      });

      if (tweet) {
        // Remove old tweet (all children except the new tempContainer)
        const children = Array.from(container.children);
        for (const child of children) {
          if (child !== tempContainer) {
            child.remove();
          }
        }

        // Fade in the new tweet
        requestAnimationFrame(() => {
          tempContainer.style.opacity = "1";
        });

        currentThemeRef.current = theme;
        setIsLoading(false);
        setIsTransitioning(false);
      } else {
        tempContainer.remove();
        if (!isThemeChange) {
          setError(true);
          setIsLoading(false);
        }
        setIsTransitioning(false);
      }
    } catch {
      if (!isThemeChange) {
        setError(true);
        setIsLoading(false);
      }
      setIsTransitioning(false);
    }
  }, [tweetId]);

  // Initial load
  useEffect(() => {
    if (!tweetId || !containerRef.current) return;

    const container = containerRef.current;
    const theme = getTheme();
    currentThemeRef.current = theme;

    const loadTweet = async () => {
      if (!window.twttr?.widgets) {
        const checkInterval = setInterval(() => {
          if (window.twttr?.widgets) {
            clearInterval(checkInterval);
            renderTweet(container, theme);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.twttr?.widgets) {
            setError(true);
            setIsLoading(false);
          }
        }, 5000);
        return;
      }

      renderTweet(container, theme);
    };

    loadTweet();
  }, [tweetId, getTheme, renderTweet]);

  // Handle theme change - smooth transition without showing skeleton
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const observer = new MutationObserver(() => {
      const newTheme = getTheme();
      
      // Only re-render if theme actually changed and tweet is already loaded
      if (newTheme !== currentThemeRef.current && !isLoading && !error && containerRef.current) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          renderTweet(containerRef.current!, newTheme, true);
        }, 100);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, [getTheme, isLoading, error, renderTweet]);

  if (!tweetId) {
    return null;
  }

  return (
    <div className={cn("relative min-h-[120px]", className)}>
      {/* Only show skeleton on initial load, not on theme change */}
      {isLoading && !isTransitioning && (
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
          "tweet-container transition-opacity duration-200",
          isLoading && !isTransitioning && "opacity-0",
          error && "hidden"
        )}
      />
    </div>
  );
}

