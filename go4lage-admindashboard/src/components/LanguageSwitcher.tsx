import React from 'react'
import { useTranslation } from 'react-i18next'
import type { SupportedLanguages } from '../i18n/index.ts'

interface LanguageSwitcherProps {
  className?: string
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
}) => {
  const { i18n, t } = useTranslation()

  const languages: { code: SupportedLanguages; name: string; flag: string }[] =
    [
      { code: 'en', name: t('language.english'), flag: '🇺🇸' },
      { code: 'de', name: t('language.german'), flag: '🇩🇪' },
    ]

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedLanguage = event.target.value as SupportedLanguages
    i18n.changeLanguage(selectedLanguage)
  }

  return (
    <div className={`w-full relative ${className}`}>
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        className="w-full appearance-none bg-surface-tertiary border border-border-default rounded-lg px-3 py-2 pr-8 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent cursor-pointer hover:bg-surface-secondary transition-colors"
      >
        {languages.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            className="bg-surface-primary text-text-primary"
          >
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}
