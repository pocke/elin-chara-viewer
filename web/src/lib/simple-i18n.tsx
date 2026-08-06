'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { resources, Language, Translations } from './i18n-resources';

export type { Language, Resources, Translations } from './i18n-resources';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export function LanguageProvider({
  children,
  initialLanguage = 'ja',
}: LanguageProviderProps): React.JSX.Element {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  return (
    <LanguageContext value={{ language, setLanguage }}>
      {children}
    </LanguageContext>
  );
}

export function useTranslation(): { t: Translations; language: Language } {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  const { language } = context;
  return { t: resources[language], language };
}
