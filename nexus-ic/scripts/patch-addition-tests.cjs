const fs = require('fs');
const path = require('path');

// 1. Update additions-n90.test.js
const n90Path = path.resolve('server/tests/additions-n90.test.js');
let n90 = fs.readFileSync(n90Path, 'utf8');

const n90Header = `import { describe, expect, it, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { searchInstitutions } from '../src/modules/registry/search.js';
import Institution from '../src/modules/institutions/Institution.js';
import InstitutionIdentifier from '../src/modules/institutions/InstitutionIdentifier.js';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_w0_test';
    await mongoose.connect(uri);
  }
  await Institution.deleteMany({ pid: { $in: ['1-7734299101', '1-7734299102', '1-7734299103'] } });
  await InstitutionIdentifier.deleteMany({ pid: { $in: ['1-7734299101', '1-7734299103'] } });
});\n`;

n90 = n90.replace(/import { describe, expect, it } from 'vitest';[\s\S]*?import InstitutionIdentifier from '\.\.\/src\/modules\/institutions\/InstitutionIdentifier\.js';/, n90Header.trim());
fs.writeFileSync(n90Path, n90, 'utf8');
console.log('Successfully updated additions-n90.test.js');

// 2. Update additions-n92.test.js
const n92Path = path.resolve('server/tests/additions-n92.test.js');
let n92 = fs.readFileSync(n92Path, 'utf8');

const n92Header = `import { describe, expect, it, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { evaluateRouting } from '../src/modules/routing/routingEngine.js';
import { DEMO_ACCOUNTS, seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_w0_test';
    await mongoose.connect(uri);
  }
  await seedDemoAccounts();
  await seedRuleBook();
});\n`;

n92 = n92.replace(/import { describe, expect, it } from 'vitest';[\s\S]*?import { DEMO_ACCOUNTS } from '\.\.\/src\/modules\/auth\/seed\.js';/, n92Header.trim());
fs.writeFileSync(n92Path, n92, 'utf8');
console.log('Successfully updated additions-n92.test.js');

// 3. Update additions-n93.test.js
const n93Path = path.resolve('server/tests/additions-n93.test.js');
let n93 = fs.readFileSync(n93Path, 'utf8');

const n93Header = `import { describe, expect, it, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import Case from '../src/modules/cases/Case.js';
import Institution from '../src/modules/institutions/Institution.js';
import { recordOfficerAction } from '../src/modules/actions/actionService.js';
import { seedDemoAccounts } from '../src/modules/auth/seed.js';
import { seedRuleBook } from '../src/modules/rulebook/seed.js';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/awaaz_dastak_w0_test';
    await mongoose.connect(uri);
  }
  await seedDemoAccounts();
  await seedRuleBook();
  await Institution.findOneAndUpdate(
    { pid: '1-7734299101' },
    {
      $set: {
        pid: '1-7734299101',
        name: 'Vidyapeeth Institute of Technology',
        state: 'Maharashtra',
        region: 'Western',
        type: 'Engineering',
        approvalStatus: 'approved',
        synthetic: true,
      }
    },
    { upsert: true, new: true }
  );
  await Case.deleteMany({ masterCaseId: { $in: ['NX-2026-930001', 'NX-2026-930002'] } });
});\n`;

n93 = n93.replace(/import { describe, expect, it } from 'vitest';[\s\S]*?import { recordOfficerAction } from '\.\.\/src\/modules\/actions\/actionService\.js';/, n93Header.trim());
fs.writeFileSync(n93Path, n93, 'utf8');
console.log('Successfully updated additions-n93.test.js');
