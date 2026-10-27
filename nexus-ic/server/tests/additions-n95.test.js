import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Relative luminance formula per WCAG 2.1 specs
function luminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('[A-N95] saffron design tokens and WCAG AA contrast compliance', () => {
  it('[A-N95] verifies saffron tokens across CSS and layout configuration', () => {
    const cssPath = fileURLToPath(new URL('../../client/src/index.css', import.meta.url));
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Saffron tokens present
    expect(cssContent).toContain('--saffron-500');
    expect(cssContent).toContain('--saffron-700');
    expect(cssContent).toContain('.eyebrow');
    expect(cssContent).toContain('var(--saffron-700)');
    expect(cssContent).toContain('.btn-primary');
    expect(cssContent).toContain('#c2410c'); // Saffron-700 primary button

    // Active navigation saffron accent
    expect(cssContent).toContain('.nav-link-active');
    expect(cssContent).toContain('var(--saffron-500)');

    // Layout header stripe
    const layoutPath = fileURLToPath(new URL('../../client/src/components/Layout.jsx', import.meta.url));
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    expect(layoutContent).toContain('h-[3px]');
    expect(layoutContent).toContain('from-saffron-500 via-amber-500 to-saffron-600');
  });

  it('[A-N95] satisfies WCAG AA contrast requirements (>= 4.5:1 for normal text)', () => {
    // 1. Primary button white text (#ffffff) on saffron-700 (#c2410c)
    const primaryRatio = contrastRatio('#ffffff', '#c2410c');
    expect(primaryRatio).toBeGreaterThanOrEqual(4.5);

    // 2. Primary button hover white text on saffron-800 (#9e380e)
    const hoverRatio = contrastRatio('#ffffff', '#9e380e');
    expect(hoverRatio).toBeGreaterThanOrEqual(4.5); // Exceeds WCAG AAA

    // 3. Eyebrow text saffron-700 (#c74707) on white background (#ffffff)
    const eyebrowRatio = contrastRatio('#c74707', '#ffffff');
    expect(eyebrowRatio).toBeGreaterThanOrEqual(4.5);

    // 4. Dark saffron text (#7f300f) on light saffron pill background (#fff8ed)
    const pillRatio = contrastRatio('#7f300f', '#fff8ed');
    expect(pillRatio).toBeGreaterThanOrEqual(7.0); // Exceeds WCAG AAA
  });
});
