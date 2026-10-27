import { afterEach, expect, it } from 'vitest';
import { canAccessCase } from '../src/middleware/rbac.js';
const originalMode=process.env.APP_MODE;
afterEach(()=>{if(originalMode===undefined)delete process.env.APP_MODE;else process.env.APP_MODE=originalMode;});
const caseDoc={owningBureau:'RB',institutionPid:'1-9876543210'};
it('[S02] a production institution administrator without an institution scope cannot access cases',async()=>{
 process.env.APP_MODE='production';
 expect(await canAccessCase({role:'institution_admin'},caseDoc)).toBe(false);
 expect(await canAccessCase({role:'institution_admin',institutionPid:caseDoc.institutionPid},caseDoc)).toBe(true);
 expect(await canAccessCase({role:'institution_admin',institutionPid:'1-0000000000'},caseDoc)).toBe(false);
});
it('[S02] the existing unscoped institution fixture exception is limited to demo mode',async()=>{
 process.env.APP_MODE='demo';expect(await canAccessCase({role:'institution_admin'},caseDoc)).toBe(true);
});
