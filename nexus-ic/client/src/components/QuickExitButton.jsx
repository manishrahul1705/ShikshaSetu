import React from 'react';
import { useI18n } from '../i18n/index.js';

/**
 * N58 (Addition): Quick-exit button.
 *
 * Appears on sensitive-category complainant pages.
 * Immediately clears local draft state and redirects to a neutral site.
 * Has no effect on server data.
 * Zero token or storage use (S16).
 */
export default function QuickExitButton({ onExit, neutralUrl = 'https://www.aicte-india.org/' }) {
  const { t } = useI18n();

  const handleExit = (e) => {
    e.preventDefault();
    // Conceal the page before cleanup or navigation can yield.
    document.body.style.setProperty('visibility', 'hidden', 'important');
    try {
      if (onExit) onExit();
    } finally {
      window.location.replace(neutralUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExit}
      title={t('quickExitTooltip')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span>{t('quickExit')}</span>
    </button>
  );
}
