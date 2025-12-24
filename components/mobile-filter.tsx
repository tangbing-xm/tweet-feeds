"use client";

import { useMemo } from "react";
import { SlidersHorizontal, X, CalendarIcon } from "lucide-react";

import { useI18n, type Locale } from "@/lib/i18n";
import { VENDORS } from "@/lib/vendors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

interface DateNode {
  year: number;
  months: {
    month: number;
    days: number[];
  }[];
}

interface MobileFilterProps {
  selectedVendor: string;
  onVendorChange: (vendor: string) => void;
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
  dateTree: DateNode[];
}

export function MobileFilter({
  selectedVendor,
  onVendorChange,
  selectedDate,
  onDateChange,
  dateTree,
}: MobileFilterProps) {
  const { locale, setLocale, t } = useI18n();

  // Convert selectedDate string to Date object
  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return undefined;
    const [year, month, day] = selectedDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [selectedDate]);

  // Build a Set of available dates from dateTree
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
    }
  };

  // Clear date selection
  const handleClearDate = () => {
    onDateChange(null);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {t("mobile.filter")}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{t("mobile.filter")}</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-100px)]">
          <div className="space-y-6 pb-8">
            {/* Vendor Filter */}
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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

            <Separator />

            {/* Date Picker - Inline Calendar */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("sidebar.jumpToDate")}
                </h2>
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearDate}
                  >
                    <X className="mr-1 h-3 w-3" />
                    {locale === "zh" ? "清除" : "Clear"}
                  </Button>
                )}
              </div>
              
              {/* Selected date display */}
              {selectedDate && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      locale === "zh" ? "zh-CN" : "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </span>
                </div>
              )}

              {/* Inline Calendar */}
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  defaultMonth={selectedDateObj}
                  className="rounded-lg border"
                />
              </div>
            </section>

            <Separator />

            {/* Language & Theme */}
            <section className="space-y-4">
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

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("sidebar.theme")}
                </span>
                <AnimatedThemeToggler className="p-2 rounded-full hover:bg-accent transition-colors" />
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Mobile Header with vendor chips
interface MobileHeaderProps {
  selectedVendor: string;
  onVendorChange: (vendor: string) => void;
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
  dateTree: DateNode[];
}

export function MobileHeader({
  selectedVendor,
  onVendorChange,
  selectedDate,
  onDateChange,
  dateTree,
}: MobileHeaderProps) {
  const { locale, t } = useI18n();

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="px-4 py-3">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("app.title")}
          </h1>
          <MobileFilter
            selectedVendor={selectedVendor}
            onVendorChange={onVendorChange}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            dateTree={dateTree}
          />
        </div>

        {/* Vendor Chips */}
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex gap-2 pb-1">
            <Badge
              variant={selectedVendor === "all" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap hover:bg-accent transition-colors"
              onClick={() => onVendorChange("all")}
            >
              {t("sidebar.all")}
            </Badge>
            {VENDORS.map((vendor) => (
              <Badge
                key={vendor.slug}
                variant={selectedVendor === vendor.slug ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap hover:bg-accent transition-colors"
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
        </ScrollArea>
      </div>
    </header>
  );
}
