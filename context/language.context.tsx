import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Fallback so the app never crashes if a screen renders before the provider mounts
const fallback: LanguageContextType = {
  language: "ar",
  setLanguage: async () => {},
  t: (key: string) => key,
  isRTL: true,
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  return context ?? fallback;
};

const translations: Record<Language, Record<string, string>> = {
  en,
  ar,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");
  // Derive isRTL directly from language — always in sync, no extra render cycle
  const isRTL = language === "ar";

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await SecureStore.getItemAsync("appLanguage");
      if (savedLanguage === "en" || savedLanguage === "ar") {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await SecureStore.setItemAsync("appLanguage", lang);
      setLanguageState(lang);
    } catch (error) {
    }
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        return key;
      }
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}
