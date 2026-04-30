import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

interface LanguageToggleProps {
  compact?: boolean;
}

export function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { toggleLanguage, language, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={t('common.languageLabel')}
      aria-label={t('common.languageLabel')}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border transition-colors ${
        compact
          ? 'border-[#D4AE5D]/40 bg-[#1f1f1f] px-3 py-2 text-sm text-[#F5E8C8] hover:bg-[#2b2b2b]'
          : 'border-[#D4AE5D]/40 bg-[#fffdf7] px-3 py-2 text-sm font-medium text-primary hover:bg-[#f7f0df]'
      }`}
    >
      <Languages className="h-4 w-4" />
      <span>{t('common.languageToggle')}</span>
      <span className="sr-only">
        {language === 'es' ? t('common.english') : t('common.spanish')}
      </span>
    </button>
  );
}
