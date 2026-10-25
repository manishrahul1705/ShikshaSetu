import React from 'react';

// Load the production asset prepared from the supplied artwork.
// Keep the wordmark fallback so missing artwork never breaks navigation.
const artwork = import.meta.glob('../../assets/shikshasetu-logo.*', { eager: true, query: '?url', import: 'default' });
const logoUrl = Object.values(artwork)[0];

// Wordmark: a door with a sound wave ("every voice, at the right door").
export default function Logo({ dark = false, compact = false, large = false, header = false, hero = false }) {
  // Screen blending removes the artwork's baked-in white when shown on the dark hero.
  // The filter keeps the wordmark readable and its warm accent visible.
  if (logoUrl) return <span className={`inline-flex shrink-0 items-center overflow-hidden ${hero ? 'mix-blend-screen' : dark ? 'rounded-xl bg-white p-2 shadow-sm' : ''} ${compact ? 'h-12 w-12' : large ? 'w-full max-w-lg' : header ? 'w-[140px] sm:w-[185px]' : 'w-[190px] sm:w-[220px]'}`}>
    <img src={compact ? '/brand/shikshasetu-icon.png' : logoUrl} alt="ShikshaSetu — powered by NEXUS-IC. Connecting Institutions. Coordinating Action. Resolving Grievances." style={hero ? { filter: 'invert(1) hue-rotate(180deg) brightness(1.3)' } : undefined} className={compact ? 'h-12 w-12 object-contain' : 'block h-auto w-full object-contain'} />
  </span>;
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
          <span className={`font-display text-[22px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink-950'}`}>Shiksha<span className={dark ? 'text-saffron-300' : 'text-saffron-700'}>Setu</span></span>
          <span className={`mt-1 max-w-[190px] text-[9px] font-medium leading-3 ${dark ? 'text-ink-200' : 'text-slate-500'}`}>Connecting Institutions. Coordinating Action. Resolving Grievances.</span>
        </span>
      )}
    </span>
  );
}
