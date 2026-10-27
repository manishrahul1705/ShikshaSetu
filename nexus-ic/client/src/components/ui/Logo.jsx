import React from 'react';

// Wordmark: a door with a sound wave ("every voice, at the right door").
export default function Logo({ dark = false, compact = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="adg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff9a37" />
            <stop offset="1" stopColor="#f06106" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="10" fill={dark ? '#1d2b55' : '#121c3d'} />
        <path d="M12 31V12a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v19" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="22.5" cy="21" r="1.4" fill="#fff" />
        <path d="M29 16.5c1.4 1.2 2.2 2.8 2.2 4.5s-.8 3.3-2.2 4.5M31.8 13.5c2.2 2 3.4 4.6 3.4 7.5s-1.2 5.5-3.4 7.5" fill="none" stroke="url(#adg)" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-[19px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink-950'}`}>AWAAZ DASTAK</span>
          <span className={`mt-1 text-[10px] font-semibold uppercase tracking-[.18em] ${dark ? 'text-saffron-300' : 'text-saffron-700'}`}>powered by NEXUS-IC</span>
        </span>
      )}
    </span>
  );
}
