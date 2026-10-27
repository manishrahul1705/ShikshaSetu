/** @type {import('tailwindcss').Config} */
// AWAAZ DASTAK design tokens: deep navy for authority, saffron for action,
// India green for resolved outcomes. Existing pages keep their slate/blue classes.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f6fb', 100: '#e8ecf6', 200: '#cbd4ea', 300: '#9eaed6', 400: '#6a81bd',
          500: '#4661a6', 600: '#344b8b', 700: '#2b3d71', 800: '#1d2b55', 900: '#121c3d', 950: '#0a1129',
        },
        saffron: {
          50: '#fff8ed', 100: '#ffefd4', 200: '#ffdba8', 300: '#ffc070', 400: '#ff9a37', 500: '#ff7d10',
          600: '#f06106', 700: '#c74707', 800: '#9e380e', 900: '#7f300f',
        },
        bharat: {
          50: '#eefbf0', 100: '#d7f5dc', 200: '#b1e9bc', 300: '#7dd693', 400: '#46bb65', 500: '#22a046',
          600: '#138808', 700: '#156b2a', 800: '#155526', 900: '#134622',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Segoe UI Variable"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        lift: '0 12px 32px -12px rgba(18,28,61,.28)',
        glow: '0 0 0 4px rgba(255,125,16,.18)',
      },
      keyframes: {
        rise: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(255,125,16,.55)' }, '100%': { boxShadow: '0 0 0 12px rgba(255,125,16,0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        rise: 'rise .45s cubic-bezier(.2,.7,.2,1) both',
        pulseRing: 'pulseRing 1.6s ease-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
