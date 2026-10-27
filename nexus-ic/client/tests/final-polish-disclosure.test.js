import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('[A-N66] the removed screen disclosure remains explicit in README, limitations and the spoken judge script', () => {
  for (const file of ['../README.md', '../docs/LIMITATIONS.md', '../docs/JUDGE_SCRIPT.md']) {
    const text = readFileSync(file, 'utf8');
    expect(text).toMatch(/prototype|not a deployed/i);
    expect(text).toMatch(/sample data|synthetic data/i);
    expect(text).toMatch(/simulat/i);
  }
  expect(readFileSync('../docs/JUDGE_SCRIPT.md', 'utf8')).toMatch(/spoken|say this|say before/i);
});
