import { it, expect } from 'vitest';
import Case from '../src/modules/cases/Case.js';
import { coordinationFlags } from '../src/modules/additions/n103-coordination/service.js';
import { listOverlaps } from '../src/modules/prevent/overlaps.js';
const user = { id: '000000000000000000000001', role: 'supervisor' };
async function create(n, bureau, extra = {}) {
  return Case.create({ masterCaseId: `NX-2026-${String(n).padStart(6, '0')}`, institutionPid: '1-1000000001', reporterId: 'RP-private', category: 'Fee Dispute', subCategory: 'Refund', narrative: n === 1 ? 'Certificate refund delayed' : 'Fire inspection approval', narrativeHash: String(n), owningBureau: bureau, ...extra });
}
it('[A-N103] unrelated PGRC and RB cases require coordination without changing PREVENT output', async () => {
  await create(1, 'PGRC'); await create(2, 'RB');
  const before = await listOverlaps(user);
  const result = await coordinationFlags(user);
  expect(result.count).toBe(1); expect(result.flags[0].cases).toHaveLength(2);
  expect(result.flags[0].level).toBe('COORDINATION_REQUIRED');
  expect(await listOverlaps(user)).toEqual(before);
});
it('[A-N103] one bureau and closed cases do not trigger coordination', async () => {
  await create(1, 'RB'); await create(2, 'RB'); await create(3, 'PGRC', { status: 'Closed' });
  expect((await coordinationFlags(user)).count).toBe(0);
});
it('[A-N103] a bureau sees only its case IDs and opaque metadata for other cases', async () => {
  await create(1, 'RB'); await create(2, 'PGRC');
  const result = await coordinationFlags({ id: 'rb-test', role: 'bureau_officer', bureau: 'Regulation Bureau' });
  expect(result.flags[0].restrictedCount).toBe(1);
  expect(result.flags[0].cases.map(c => c.masterCaseId)).toEqual(['NX-2026-000001']);
  expect(JSON.stringify(result)).not.toMatch(/NX-2026-000002|narrative|reporterId/);
  expect((await coordinationFlags({ id: 'other', role: 'bureau_officer', bureau: 'AB' })).count).toBe(0);
});
