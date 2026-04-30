import { useEffect, useMemo, useState } from 'react';
import { translate, type Language } from '../i18n/translations';
import { LanguageContext } from './language-context';

const STORAGE_KEY = 'app-language';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'es';
  }

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
  return storedLanguage === 'en' ? 'en' : 'es';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
      toggleLanguage: () => setLanguageState((current) => (current === 'es' ? 'en' : 'es')),
      t: (key: string, replacements?: Record<string, string>) =>
        translate(language, key, replacements),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
