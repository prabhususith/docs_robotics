/**
 * RoboCore Studio — Lightweight Offline i18n Engine (< 3 KB, Zero Dependencies)
 * Unicode script-safe font stacks, localStorage persistence, and Bilingual Study Mode.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SupportedLocale } from "@robocore/shared-bridge";

import enDict from "./locales/en.json";
import taDict from "./locales/ta.json";
import hiDict from "./locales/hi.json";
import jaDict from "./locales/ja.json";
import deDict from "./locales/de.json";

export type TranslationCatalog = Record<string, string>;

const dictionaries: Record<SupportedLocale, TranslationCatalog> = {
  en: enDict as TranslationCatalog,
  ta: taDict as TranslationCatalog,
  hi: hiDict as TranslationCatalog,
  ja: jaDict as TranslationCatalog,
  de: deDict as TranslationCatalog
};

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  bilingualMode: boolean;
  setBilingualMode: (enabled: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tBilingual: (key: string, params?: Record<string, string | number>) => { localized: string; english: string; display: string };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const FONT_STACK_BY_LOCALE: Record<SupportedLocale, string> = {
  en: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  ta: "'Noto Sans Tamil', 'Latha', 'Vijaya', system-ui, sans-serif",
  hi: "'Noto Sans Devanagari', 'Mangal', 'Aparajita', system-ui, sans-serif",
  ja: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Meiryo', system-ui, sans-serif",
  de: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    const saved = localStorage.getItem("robocore_locale") as SupportedLocale;
    return saved && dictionaries[saved] ? saved : "en";
  });

  const [bilingualMode, setBilingualModeState] = useState<boolean>(() => {
    return localStorage.getItem("robocore_bilingual_mode") === "true";
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem("robocore_locale", newLocale);
  };

  const setBilingualMode = (enabled: boolean) => {
    setBilingualModeState(enabled);
    localStorage.setItem("robocore_bilingual_mode", enabled ? "true" : "false");
  };

  const interpolate = (template: string, params?: Record<string, string | number>): string => {
    if (!params) return template;
    let res = template;
    for (const [k, v] of Object.entries(params)) {
      res = res.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
    return res;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const activeDict = dictionaries[locale] || dictionaries.en;
    const raw = activeDict[key] || dictionaries.en[key] || key;
    return interpolate(raw, params);
  };

  const tBilingual = (key: string, params?: Record<string, string | number>) => {
    const locText = t(key, params);
    const enText = interpolate(dictionaries.en[key] || key, params);

    if (bilingualMode && locale !== "en") {
      return {
        localized: locText,
        english: enText,
        display: `${locText} (${enText})`
      };
    }

    return {
      localized: locText,
      english: enText,
      display: locText
    };
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.body.style.fontFamily = FONT_STACK_BY_LOCALE[locale];
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, bilingualMode, setBilingualMode, t, tBilingual }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};
