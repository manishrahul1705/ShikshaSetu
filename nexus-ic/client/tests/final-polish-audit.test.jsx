import React from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditTrail from '../src/pages/audit/AuditTrail.jsx';

vi.mock('../src/pages/closure/api.jsx', () => ({ useS5: () => ({ data: {
  chain: { intact: true, count: 1 }, total: 1,
  events: [{ seq: 1, at: '2026-10-26T00:00:00Z', actorRole: 'competent_authority', action: 'patterns.viewed', targetType: 'ImpactPatterns', targetId: 'DEMO-PATTERN-v1', hash: '123456789012abcdef' }],
} }) }));

it('[N66] audit rule targets show a friendly version and retain the complete ID only in the audit tooltip', () => {
  const { container } = render(<AuditTrail />);
  expect(screen.getByText('Rule v1')).toHaveAttribute('title', 'DEMO-PATTERN-v1');
  expect(container.textContent).not.toMatch(/\b(synthetic|demo|fake|sample)\b|test data/i);
  expect(screen.getByText('patterns.viewed')).toBeInTheDocument();
  expect(screen.getByText('123456789012')).toBeInTheDocument();
});
