import { it, expect, vi } from 'vitest';
import request from 'supertest';
import { parseClientOrigins, parseTrustProxyHops } from '../src/config/hosting.js';
vi.mock('../src/config/env.js', () => ({ default: {
  CLIENT_ORIGIN: 'https://shikshasetu.automconsultancy.in',
  CLIENT_ORIGINS: ['https://shikshasetu.automconsultancy.in', 'https://shikshasetu-client-phi.vercel.app'],
  TRUST_PROXY_HOPS: 1, APP_MODE: 'production', SESSION_SECRET: 'hosting-test-only',
} }));
vi.mock('connect-mongo', async () => {
  const { default: session } = await import('express-session');
  return { default: { create: () => new session.MemoryStore() } };
});
vi.mock('../src/modules/additions/n108-reminders/scheduler.js', () => ({ startReminderScheduler: vi.fn() }));
vi.mock('../src/routes.js', async () => {
  const { Router } = await import('express');
  const router = Router();
  router.all('/hosting-check', (req, res) => {
    req.session.checked = true;
    res.json({ secure: req.secure, ip: req.ip });
  });
  return { default: router };
});
import { createApp } from '../src/app.js';
import env from '../src/config/env.js';
it('validates origins, canonical fallback and proxy configuration', () => {
  expect(parseClientOrigins(undefined, env.CLIENT_ORIGIN)).toEqual([env.CLIENT_ORIGIN]);
  expect(parseClientOrigins(' ', env.CLIENT_ORIGIN)).toEqual([env.CLIENT_ORIGIN]);
  expect(parseClientOrigins(env.CLIENT_ORIGINS.join(', '), env.CLIENT_ORIGIN)).toEqual(env.CLIENT_ORIGINS);
  for (const value of ['*', 'https://*.example.com', 'https://example.com/path', 'https://user@example.com', 'null', 'https://example.com,']) expect(() => parseClientOrigins(value, env.CLIENT_ORIGIN)).toThrow();
  expect(parseTrustProxyHops()).toBe(0);
  expect(parseTrustProxyHops('1')).toBe(1);
  for (const value of ['true', '-1', '1.5']) expect(() => parseTrustProxyHops(value)).toThrow();
});
for (const origin of env.CLIENT_ORIGINS) it(`allows credentialed CORS, CSRF and secure cookies: ${origin}`, async () => {
  const app = createApp();
  const preflight = await request(app).options('/api/v1/hosting-check').set('Origin', origin).set('Access-Control-Request-Method', 'POST');
  expect(preflight.status).toBe(204);
  expect(preflight.headers['access-control-allow-origin']).toBe(origin);
  expect(preflight.headers['access-control-allow-credentials']).toBe('true');
  const response = await request(app).post('/api/v1/hosting-check').set('Origin', origin).set('X-Forwarded-Proto', 'https');
  expect(response.status).toBe(200);
  for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax']) expect(response.headers['set-cookie'][0]).toContain(attribute);
  expect((await request(app).post('/api/v1/hosting-check').set('Referer', `${origin}/page`)).status).toBe(200);
});
it('rejects other origins and invalid referers without reflecting host', async () => {
  const app = createApp();
  for (const origin of ['https://evil.example', `${env.CLIENT_ORIGIN}.evil.example`, 'http://localhost:5173', 'null']) {
    const response = await request(app).post('/api/v1/hosting-check').set('Origin', origin);
    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  }
  for (const referer of ['https://evil.example/page', 'invalid']) expect((await request(app).post('/api/v1/hosting-check').set('Host', 'evil.example').set('Referer', referer)).status).toBe(403);
});
it('requires trusted HTTPS for secure cookies and limits trusted hops', async () => {
  const app = createApp();
  expect(app.get('trust proxy')).toBe(1);
  const https = await request(app).post('/api/v1/hosting-check').set('X-Forwarded-Proto', 'https').set('X-Forwarded-For', '198.51.100.1, 198.51.100.2');
  expect(https.body).toEqual({ secure: true, ip: '198.51.100.2' });
  expect(https.headers['set-cookie']).toBeDefined();
  expect((await request(app).post('/api/v1/hosting-check').set('X-Forwarded-Proto', 'http')).headers['set-cookie']).toBeUndefined();
  app.set('trust proxy', 0);
  const untrusted = await request(app).post('/api/v1/hosting-check').set('X-Forwarded-Proto', 'https');
  expect(untrusted.body.secure).toBe(false);
  expect(untrusted.headers['set-cookie']).toBeUndefined();
});
