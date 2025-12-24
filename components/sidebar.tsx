"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n, type Locale } from "@/lib/i18n";
import { VENDORS } from "@/lib/vendors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

interface DateNode {
  year: number;
  months: {
    month: number;
    days: number[];
  }[];
}

interface SidebarProps {
  selectedVendor: string;
  onVendorChange: (vendor: string) => void;
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
  dateTree: DateNode[];
  className?: string;
}

export function Sidebar({
  selectedVendor,
  onVendorChange,
  selectedDate,
  onDateChange,
  dateTree,
  className,
}: SidebarProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  // Convert selectedDate string to Date object
  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return undefined;
    const [year, month, day] = selectedDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [selectedDate]);

  // Build a Set of available dates from dateTree for disabling unavailable dates
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    for (const yearNode of dateTree) {
      for (const monthNode of yearNode.months) {
        for (const day of monthNode.days) {
          const dateStr = `${yearNode.year}-${String(monthNode.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          dates.add(dateStr);
        }
      }
    }
    return dates;
  }, [dateTree]);

  // Disable dates that are not in availableDates
  const isDateDisabled = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return !availableDates.has(dateStr);
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      onDateChange(dateStr);
      setOpen(false);
    }
  };

  // Clear date selection
  const handleClearDate = () => {
    onDateChange(null);
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return locale === "zh" ? "选择日期" : "Pick a date";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-background/80 backdrop-blur-xl",
        "border-r border-border",
        className
      )}
    >
      {/* Logo & Title */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("app.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground pl-[52px]">
          {t("app.subtitle")}
        </p>
      </div>

      <Separator />

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-8">
          {/* Vendor Filter */}
          <section>
            <h2 className="px-2 mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("sidebar.vendors")}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedVendor === "all" ? "default" : "outline"}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onVendorChange("all")}
              >
                {t("sidebar.all")}
              </Badge>
              {VENDORS.map((vendor) => (
                <Badge
                  key={vendor.slug}
                  variant={selectedVendor === vendor.slug ? "default" : "outline"}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onVendorChange(vendor.slug)}
                  style={
                    selectedVendor === vendor.slug
                      ? { backgroundColor: vendor.color, borderColor: vendor.color }
                      : undefined
                  }
                >
                  {locale === "zh" ? vendor.nameZh : vendor.nameEn}
                </Badge>
              ))}
            </div>
          </section>

          {/* Date Picker */}
          <section>
            <h2 className="px-2 mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("sidebar.jumpToDate")}
            </h2>
            <div className="space-y-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDisplayDate(selectedDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDateObj}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    defaultMonth={selectedDateObj}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Clear button when date is selected */}
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={handleClearDate}
                >
                  <X className="mr-2 h-3 w-3" />
                  {locale === "zh" ? "清除日期筛选" : "Clear date filter"}
                </Button>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>

      <Separator />

      {/* Bottom Controls */}
      <div className="px-6 py-4 space-y-4">
        {/* Language Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("sidebar.language")}
          </span>
          <ToggleGroup
            type="single"
            value={locale}
            onValueChange={(value) => value && setLocale(value as Locale)}
            size="sm"
          >
            <ToggleGroupItem value="en" aria-label="English" className="text-xs px-3">
              EN
            </ToggleGroupItem>
            <ToggleGroupItem value="zh" aria-label="中文" className="text-xs px-3">
              中文
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("sidebar.theme")}
          </span>
          <AnimatedThemeToggler className="p-2 rounded-full hover:bg-accent transition-colors" />
        </div>
      </div>
    </aside>
  );
}
