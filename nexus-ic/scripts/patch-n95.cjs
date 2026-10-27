const fs = require('fs');
const path = require('path');

// 1. Patch client/src/index.css
const cssPath = path.resolve('client/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

const oldBtnPrimary = `.btn-primary { background: var(--ink-900); color: #fff; box-shadow: var(--shadow-lift); }
  .btn-primary:hover { background: var(--ink-800); }`;

const newBtnPrimary = `.btn-primary { background: #c2410c; color: #ffffff; font-weight: 600; box-shadow: 0 1px 3px rgba(194,65,12,.25); }
  .btn-primary:hover { background: #9e380e; }
  .btn-primary:focus-visible { outline: 3px solid var(--saffron-400); outline-offset: 2px; }`;

if (css.includes('.btn-primary { background: var(--ink-900)')) {
  css = css.replace(oldBtnPrimary, newBtnPrimary);
}

const oldNavActive = `.nav-link-active { background: rgba(255,255,255,.1); color: #fff; box-shadow: inset 3px 0 0 var(--saffron-500); }`;
const newNavActive = `.nav-link-active { background: rgba(255,255,255,.12); color: #fff; box-shadow: inset 4px 0 0 var(--saffron-500); }`;

if (css.includes(oldNavActive)) {
  css = css.replace(oldNavActive, newNavActive);
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Successfully patched index.css with saffron tokens');

// 2. Patch client/src/components/Layout.jsx for 3px header stripe
const layoutPath = path.resolve('client/src/components/Layout.jsx');
let layout = fs.readFileSync(layoutPath, 'utf8');

const oldAppHeader = `<header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">`;
const newAppHeader = `<header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="h-[3px] bg-gradient-to-r from-saffron-500 via-amber-500 to-saffron-600 w-full shrink-0" />`;

if (layout.includes(oldAppHeader) && !layout.includes('h-[3px]')) {
  layout = layout.replace(oldAppHeader, newAppHeader);
}

const oldPublicHeader = `<header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">`;
const newPublicHeader = `<header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="h-[3px] bg-gradient-to-r from-saffron-500 via-amber-500 to-saffron-600 w-full shrink-0" />`;

if (layout.includes(oldPublicHeader) && !layout.includes('from-saffron-500 via-amber-500')) {
  layout = layout.replace(oldPublicHeader, newPublicHeader);
}

fs.writeFileSync(layoutPath, layout, 'utf8');
console.log('Successfully patched Layout.jsx with top header saffron stripe');
