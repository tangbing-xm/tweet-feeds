"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface BackToTopProps {
  className?: string;
  threshold?: number;
}

export function BackToTop({ className, threshold = 400 }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useI18n();

  const getPrimaryScrollViewport = () => {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot="scroll-area-viewport"]'),
    );

    const vertical = candidates.filter(
      (el) => el.scrollHeight > el.clientHeight + 10,
    );
    if (vertical.length === 0) return null;

    // pick the largest vertical viewport (usually the main feed scroll area)
    return vertical.sort((a, b) => b.clientHeight - a.clientHeight)[0] ?? null;
  };

  useEffect(() => {
    const scrollEl = getPrimaryScrollViewport();

    const handleScroll = () => {
      const y = scrollEl ? scrollEl.scrollTop : window.scrollY;
      setIsVisible(y > threshold);
    };

    handleScroll();

    if (scrollEl) {
      scrollEl.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollEl.removeEventListener("scroll", handleScroll);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    const scrollEl = getPrimaryScrollViewport();

    if (scrollEl) {
      scrollEl.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
        "transition-all duration-300 ease-out",
        "bg-background/80 backdrop-blur-xl border border-border",
        "hover:scale-110 hover:shadow-xl",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
      aria-label={t("backToTop")}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}

