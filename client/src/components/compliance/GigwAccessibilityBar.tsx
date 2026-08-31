import React, { useState } from 'react';
import { useAccessibility, LanguageCode } from '../../context/AccessibilityContext';
import { Eye, Volume2, Globe, ChevronDown } from 'lucide-react';

export const GigwAccessibilityBar: React.FC = () => {
  const {
    fontSize,
    setFontSize,
    highContrast,
    toggleHighContrast,
    screenReaderActive,
    toggleScreenReader,
    language,
    setLanguage,
  } = useAccessibility();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const languages: { code: LanguageCode; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  return (
    <div
      role="region"
      aria-label="GIGW 3.0 Universal Accessibility and Government Compliance Bar"
      className="bg-slate-900 text-slate-200 text-[11px] font-medium py-1 px-4 sm:px-6 lg:px-8 border-b border-slate-800 select-none z-50 relative flex items-center justify-between"
    >
      {/* Left: Official Indian Government Emblem Strip */}
      <div className="flex items-center space-x-2.5">
        {/* Tricolor Indicator */}
        <div className="flex items-center space-x-0.5" aria-hidden="true">
          <span className="w-1.5 h-3.5 bg-amber-500 rounded-l-sm"></span>
          <span className="w-1.5 h-3.5 bg-white"></span>
          <span className="w-1.5 h-3.5 bg-emerald-500 rounded-r-sm"></span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-white tracking-wide">
            Government of India Guidelines Compliant
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden md:inline">
            GIGW 3.0 & DPDP Act (2023) Certified Architecture
          </span>
        </div>
      </div>

      {/* Right: Accessibility Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Screen Reader Voice Toggle */}
        <button
          onClick={toggleScreenReader}
          aria-label={`Toggle Screen Reader Accessibility. Currently ${screenReaderActive ? 'Active' : 'Inactive'}`}
          className={`px-2 py-0.5 rounded flex items-center space-x-1 text-[10px] font-bold transition-colors ${
            screenReaderActive
              ? 'bg-blue-600 text-white ring-1 ring-blue-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Volume2 className="w-3 h-3 text-blue-400" />
          <span className="hidden sm:inline">Screen Reader: {screenReaderActive ? 'ON' : 'OFF'}</span>
        </button>

        {/* High Contrast Toggle */}
        <button
          onClick={toggleHighContrast}
          aria-label={`Toggle High Contrast Mode. Currently ${highContrast ? 'Active' : 'Standard'}`}
          className={`px-2 py-0.5 rounded flex items-center space-x-1 text-[10px] font-bold transition-colors ${
            highContrast
              ? 'bg-amber-400 text-slate-950 font-black ring-1 ring-amber-300'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Eye className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">High Contrast</span>
        </button>

        {/* Font Size Adjusters [A-] [A] [A+] */}
        <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700" role="group" aria-label="Font Size Adjusters">
          <button
            onClick={() => setFontSize('sm')}
            aria-label="Decrease Font Size"
            className={`px-1.5 py-0.5 rounded font-mono font-extrabold text-[10px] transition-colors ${
              fontSize === 'sm' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            A-
          </button>
          <button
            onClick={() => setFontSize('base')}
            aria-label="Default Font Size"
            className={`px-1.5 py-0.5 rounded font-mono font-extrabold text-[10px] transition-colors ${
              fontSize === 'base' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            A
          </button>
          <button
            onClick={() => setFontSize('lg')}
            aria-label="Increase Font Size"
            className={`px-1.5 py-0.5 rounded font-mono font-extrabold text-[10px] transition-colors ${
              fontSize === 'lg' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            A+
          </button>
        </div>

        {/* Language Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            aria-label="Select Official Language"
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 text-[10px] font-bold border border-slate-700"
          >
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>{currentLangObj.native}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs font-bold animate-in fade-in duration-150">
              <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                Eighth Schedule Languages
              </div>
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors ${
                    language === l.code ? 'text-blue-700 bg-blue-50/60 font-black' : 'text-slate-700'
                  }`}
                >
                  <span>{l.native}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({l.label})</span>
                </button>
              ))}
              <div className="px-3 py-1 text-[9px] text-slate-400 font-semibold border-t border-slate-100 text-center">
                +14 More Official Languages
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GigwAccessibilityBar;
