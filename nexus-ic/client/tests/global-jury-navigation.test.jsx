import { expect, it } from 'vitest';
import { navFor } from '../src/components/navigation.js';
import routes from '../src/routes/index.jsx';

it('[S02] every sidebar link is allowed by its real route for each role, including complainant-only channels', () => {
  for (const role of ['student', 'faculty', 'institution_admin', 'bureau_officer', 'regional_officer', 'supervisor', 'competent_authority', 'auditor', 'system_admin']) {
    const items = navFor(role).flatMap(group => group.items);
    expect(items.length).toBeGreaterThan(2);
    for (const item of items) {
      if (item.to === '/dashboard') continue;
      expect(routes.some(route => route.path === item.to && (!route.roles || route.roles.includes(role))), `${role}: ${item.to}`).toBe(true);
    }
    expect(items.some(item => item.to === '/channels')).toBe(['student', 'faculty'].includes(role));
  }
});
