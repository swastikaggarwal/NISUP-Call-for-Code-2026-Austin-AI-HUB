"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Language, LanguageCode } from "@/lib/types";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/lib/languages";

interface LanguageContextValue {
  language: Language;
  setLanguageByCode: (code: LanguageCode) => void;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// localStorage is used ONLY for the language preference (allowed by the spec).
// Conversation/case data never touches localStorage.
const STORAGE_KEY = "nisup.language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      const found = LANGUAGES.find((l) => l.code === saved);
      if (found) setLanguage(found);
    } catch {
      /* ignore */
    }
  }, []);

  const setLanguageByCode = (code: LanguageCode) => {
    const found = LANGUAGES.find((l) => l.code === code) ?? DEFAULT_LANGUAGE;
    setLanguage(found);
    try {
      localStorage.setItem(STORAGE_KEY, found.code);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(
    () => ({ language, setLanguageByCode, languages: LANGUAGES }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
