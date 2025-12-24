"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "en" | "zh";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Header
    "app.title": "AI Vendor Feed",
    "app.subtitle": "Latest updates from AI companies",
    
    // Sidebar
    "sidebar.vendors": "Vendors",
    "sidebar.all": "All",
    "sidebar.jumpToDate": "Jump to Date",
    "sidebar.theme": "Theme",
    "sidebar.language": "Language",
    
    // Feed
    "feed.loading": "Loading...",
    "feed.loadingMore": "Loading more...",
    "feed.noTweets": "No tweets found",
    "feed.endOfFeed": "You've reached the end",
    
    // Mobile
    "mobile.filter": "Filter",
    "mobile.apply": "Apply",
    "mobile.close": "Close",
    
    // Back to top
    "backToTop": "Back to top",
    
    // Time
    "time.today": "Today",
    "time.yesterday": "Yesterday",
  },
  zh: {
    // Header
    "app.title": "AI 厂商动态",
    "app.subtitle": "来自 AI 公司的最新更新",
    
    // Sidebar
    "sidebar.vendors": "厂商",
    "sidebar.all": "全部",
    "sidebar.jumpToDate": "跳转到日期",
    "sidebar.theme": "主题",
    "sidebar.language": "语言",
    
    // Feed
    "feed.loading": "加载中...",
    "feed.loadingMore": "加载更多...",
    "feed.noTweets": "暂无推文",
    "feed.endOfFeed": "已经到底了",
    
    // Mobile
    "mobile.filter": "筛选",
    "mobile.apply": "应用",
    "mobile.close": "关闭",
    
    // Back to top
    "backToTop": "回到顶部",
    
    // Time
    "time.today": "今天",
    "time.yesterday": "昨天",
  },
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("locale") as Locale | null;
    return saved === "en" || saved === "zh" ? saved : "en";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  }, []);

  const t = useCallback(
    (key: string) => translations[locale][key] ?? key,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

