import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitch() {
  const { i18n, t } = useTranslation()
  const english = i18n.resolvedLanguage === 'en'

  const changeLanguage = () => {
    const language = english ? 'zh' : 'en'
    localStorage.setItem('language', language)
    void i18n.changeLanguage(language)
  }

  return (
    <button
      type="button"
      className="fixed right-4 top-4 z-900 flex h-9 items-center gap-2 rounded-lg border bg-background/90 px-3 text-sm font-medium shadow-sm backdrop-blur hover:bg-accent"
      aria-label={t('language.label')}
      onClick={changeLanguage}
    >
      <Languages className="size-4" />
      {english ? t('language.zh') : t('language.en')}
    </button>
  )
}
