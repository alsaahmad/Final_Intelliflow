import { useAccessibility, LanguageCode } from '../context/AccessibilityContext';
import en from './en.json';
import hi from './hi.json';
import { translateGlossaryTerm } from './glossary';

const dictionaries: Record<LanguageCode, any> = {
  en,
  hi,
  ta: en,
  te: en,
  bn: en,
  mr: en,
  gu: en,
  kn: en,
};

export const useTranslation = () => {
  const { language, setLanguage } = useAccessibility();

  const t = (path: string, fallback?: string): string => {
    // 1. Check Controlled Government Glossary first
    const glossaryMatch = translateGlossaryTerm(path, language);
    if (glossaryMatch !== path) {
      return glossaryMatch;
    }

    // 2. Traversal path in JSON dictionary e.g. "police.portalTitle"
    const keys = path.split('.');
    let current: any = dictionaries[language] || en;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary
        let fallbackCurrent: any = en;
        for (const fKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fKey];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackCurrent === 'string' ? fallbackCurrent : fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  };

  return { t, language, setLanguage, translateGlossary: (term: string) => translateGlossaryTerm(term, language) };
};
