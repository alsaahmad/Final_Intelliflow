import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FontSizeOption = 'sm' | 'base' | 'lg';
export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn';

interface AccessibilityContextType {
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  screenReaderActive: boolean;
  toggleScreenReader: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState<FontSizeOption>('base');
  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderActive, setScreenReaderActive] = useState(false);
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('intelliflow_language');
    return (saved as LanguageCode) || 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('intelliflow_language', lang);
  };

  // Apply high-contrast or font size to document body
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    if (fontSize === 'lg') {
      root.style.fontSize = '17.5px';
    } else if (fontSize === 'sm') {
      root.style.fontSize = '14.5px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [highContrast, fontSize]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleScreenReader = () => setScreenReaderActive((prev) => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        toggleHighContrast,
        screenReaderActive,
        toggleScreenReader,
        language,
        setLanguage,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
