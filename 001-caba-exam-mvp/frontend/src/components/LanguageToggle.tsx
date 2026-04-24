import React from 'react';
import type { LanguageMode } from '../types';

interface LanguageToggleProps {
  mode: LanguageMode;
  onChange: (mode: LanguageMode) => void;
}

const labels: Record<LanguageMode, string> = {
  es_ru: 'ES + RU',
  es_only: 'ES',
  ru_only: 'RU',
};

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="language-toggle">
      {(Object.keys(labels) as LanguageMode[]).map((m) => (
        <button
          key={m}
          className={`language-toggle-btn ${mode === m ? 'active' : ''}`}
          onClick={() => onChange(m)}
        >
          {labels[m]}
        </button>
      ))}
    </div>
  );
};
