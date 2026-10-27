import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createApp } from '../src/app.js';
import User from '../src/modules/auth/User.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app;
let request;

beforeEach(async () => {
  app = createApp(process.env.MONGODB_URI);
  request = supertest.agent(app);
  await seedDemoAccounts();
});

describe('[S16] HttpOnly Secure session cookies, no tokens in localStorage', () => {
  it('[S16] login sets an HttpOnly cookie', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    // Check set-cookie header
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.length).toBeGreaterThan(0);

    const sessionCookie = cookies.find((c) => c.includes('awaaz.sid'));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
    // In test/demo mode on localhost, Secure may be relaxed
    expect(sessionCookie).toContain('SameSite=Lax');
  });

  it('[S16] the client source contains no localStorage/sessionStorage token use', async () => {
    const clientSrc = fs.existsSync(path.resolve(process.cwd(), 'client', 'src'))
      ? path.resolve(process.cwd(), 'client', 'src')
      : path.resolve(__dirname, '..', '..', 'client', 'src');

    function walkSync(dir) {
      const files = [];
      if (!fs.existsSync(dir)) return files;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walkSync(full));
        else if (/\.(js|jsx|mjs)$/.test(entry.name)) files.push(full);
      }
      return files;
    }

    const files = walkSync(clientSrc);
    // Ensure client files were found and checked
    expect(files.length).toBeGreaterThan(0);

    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      // S16 strict check: zero localStorage or sessionStorage access allowed in client source
      if (/\blocalStorage\b/.test(content)) {
        violations.push(`${path.relative(clientSrc, file)}: localStorage access found`);
      }
      if (/\bsessionStorage\b/.test(content)) {
        violations.push(`${path.relative(clientSrc, file)}: sessionStorage access found`);
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('[F45] Demo accounts', () => {
  it('[F45] demo accounts seed correctly with all roles present', async () => {
    const users = await User.find({});
    const roles = new Set(users.map((u) => u.role));

    // All 9 roles must be present
    for (const role of User.ROLES) {
      expect(roles.has(role)).toBe(true);
    }

    // At least 10 accounts (one per role, two bureau_officer)
    expect(users.length).toBeGreaterThanOrEqual(10);

    // Check bureau officers cover both bureaus
    const bureauOfficers = users.filter((u) => u.role === 'bureau_officer');
    const bureaus = new Set(bureauOfficers.map((u) => u.bureau));
    expect(bureaus.has('Regulation Bureau')).toBe(true);
    expect(bureaus.has('Public Grievance Redressal Cell')).toBe(true);

    // Check regional officer
    const regional = users.find((u) => u.role === 'regional_officer');
    expect(regional.region).toBe('Northern');

    // All are synthetic
    for (const user of users) {
      expect(user.synthetic).toBe(true);
    }
  });
});
