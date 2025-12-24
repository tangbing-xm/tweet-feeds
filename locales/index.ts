import { en } from "./en";
import { zh } from "./zh";

export type Locale = "en" | "zh";

export type TranslationKey = keyof typeof en;

export const translations: Record<Locale, Record<string, string>> = {
  en,
  zh,
};

