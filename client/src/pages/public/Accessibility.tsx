import React, { useState } from 'react';
import {
  Eye,
  Type,
  Sparkles,
} from 'lucide-react';

export const Accessibility: React.FC = () => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className={`py-12 sm:py-16 ${highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
            <Eye className="w-3.5 h-3.5" />
            <span>Inclusive Civic Access</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Accessibility Statement & Tools
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            IntelliFlow AI is committed to ensuring digital accessibility for people with disabilities in accordance with WCAG 2.1 Level AA standards.
          </p>
        </div>

        {/* Live Interactive Accessibility Controls Bar */}
        <div className="light-card p-6 border-slate-200 bg-white shadow-card space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>On-Page Assistive Display Controls</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Font Size Adjuster */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Type className="w-4 h-4 text-brand-600" />
                <span>Text Sizing</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fontSize === 'normal' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Standard (100%)
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fontSize === 'large' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Large (120%)
                </button>
                <button
                  onClick={() => setFontSize('larger')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    fontSize === 'larger' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Extra Large (140%)
                </button>
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-brand-600" />
                <span>Contrast Mode</span>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  highContrast ? 'bg-amber-400 text-black' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <span>{highContrast ? 'Disable High Contrast Mode' : 'Enable High Contrast (Black & Yellow)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Accessibility Features & Commitments */}
        <div className="space-y-6">
          <div className="light-card p-6 border-slate-200 bg-white space-y-3">
            <h3 className="text-base font-bold text-slate-900">1. Screen Reader Compatibility</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All UI components are structured with semantic HTML5 landmarks (`&lt;main&gt;`, `&lt;nav&gt;`, `&lt;header&gt;`, `&lt;footer&gt;`), ARIA attributes (`aria-expanded`, `aria-live`, `aria-label`), and alt descriptions for all maps and infographics.
            </p>
          </div>

          <div className="light-card p-6 border-slate-200 bg-white space-y-3">
            <h3 className="text-base font-bold text-slate-900">2. Keyboard Navigation Support</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Users can navigate every page, trigger dialogs, submit forms, and operate emergency buttons using the <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[11px]">Tab</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[11px]">Shift + Tab</kbd>, and <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[11px]">Enter</kbd> keys.
            </p>
          </div>

          <div className="light-card p-6 border-slate-200 bg-white space-y-3">
            <h3 className="text-base font-bold text-slate-900">3. Color Contrast & Visual Clarity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our clean light theme adheres to a minimum 4.5:1 contrast ratio for standard body text and 3:1 for graphical user interface controls and emergency buttons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
