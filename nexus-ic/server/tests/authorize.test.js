import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../src/app.js';
import { seedDemoAccounts, DEMO_PASSWORD } from '../src/modules/auth/seed.js';

let app;

beforeEach(async () => {
  app = createApp(process.env.MONGODB_URI);
  await seedDemoAccounts();
});

/**
 * [S01] every /api route except login/health rejects unauthenticated and wrong-role requests.
 *
 * Public routes (allow-list):
 * - POST /api/v1/auth/login
 * - GET  /api/v1/health
 * - GET  /api/v1/config/mode
 * Everything else must return 401 without a session and have an authorize middleware.
 */

const PUBLIC_ROUTES = [
  { method: 'get', path: '/api/v1/health' },
  { method: 'post', path: '/api/v1/auth/login' },
  { method: 'get', path: '/api/v1/config/mode' },
];

function isPublic(method, routePath) {
  const norm = routePath.endsWith('/') && routePath.length > 1 ? routePath.slice(0, -1) : routePath;
  return PUBLIC_ROUTES.some(
    (r) => r.method === method.toLowerCase() && (r.path === routePath || r.path === norm)
  );
}

function extractPathFromRegexp(regexp) {
  if (!regexp) return '';
  const src = regexp.source;
  const match = src.match(/^\^((?:\\\/[a-zA-Z0-9_\-]+)+)/);
  if (match) {
    return match[1].replace(/\\\//g, '/');
  }
  return '';
}

function extractRoutes(appInstance) {
  const routes = [];

  function walkStack(stack, basePath = '') {
    for (const layer of stack) {
      if (layer.route) {
        let routePath = basePath + layer.route.path;
        routePath = routePath.replace(/\/+/g, '/');
        if (layer.route.path === '/' && !routePath.endsWith('/')) {
          routePath += '/';
        }
        for (const method of Object.keys(layer.route.methods)) {
          routes.push({ method, path: routePath, route: layer.route });
        }
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        const mountPath = extractPathFromRegexp(layer.regexp);
        walkStack(layer.handle.stack, basePath + mountPath);
      }
    }
  }

  if (appInstance._router && appInstance._router.stack) {
    walkStack(appInstance._router.stack);
  }
  return routes;
}

describe('[S01] Zero trust: every request re-authorized server-side', () => {
  it('[S01] every /api route except login/health rejects unauthenticated and wrong-role requests', async () => {
    const routes = extractRoutes(app);
    const apiRoutes = routes.filter((r) => r.path.startsWith('/api/'));

    // Must have registered routes
    expect(apiRoutes.length).toBeGreaterThan(0);

    // Explicit check: route walker must build full /api/v1 paths including /api/v1/auth/me
    const extractedPaths = apiRoutes.map((r) => r.path);
    expect(extractedPaths).toContain('/api/v1/auth/me');
    expect(extractedPaths).toContain('/api/v1/health');
    expect(extractedPaths).toContain('/api/v1/auth/logout');
    expect(extractedPaths).toContain('/api/v1/audit/verify');
    expect(extractedPaths).toContain('/api/v1/users/');

    for (const route of apiRoutes) {
      if (isPublic(route.method, route.path)) continue;

      // Assert that every non-public route layer has a middleware with _isAuthorize === true
      const hasAuthorize = route.route.stack.some(
        (s) => s.handle && s.handle._isAuthorize === true
      );
      expect(
        hasAuthorize,
        `Route ${route.method.toUpperCase()} ${route.path} must have authorize middleware (_isAuthorize === true)`
      ).toBe(true);

      // Send an unauthenticated request to verify 401 response
      const agent = supertest(app);
      let res;
      switch (route.method) {
        case 'get':
          res = await agent.get(route.path);
          break;
        case 'post':
          res = await agent.post(route.path).send({});
          break;
        case 'put':
          res = await agent.put(route.path).send({});
          break;
        case 'delete':
          res = await agent.delete(route.path);
          break;
        case 'patch':
          res = await agent.patch(route.path).send({});
          break;
        default:
          continue;
      }

      expect(
        res.status,
        `Route ${route.method.toUpperCase()} ${route.path} should reject unauthenticated requests with 401`
      ).toBe(401);
    }
  });

  it('[S01] wrong role is rejected with 403', async () => {
    // Login as student
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'student1', password: DEMO_PASSWORD })
      .expect(200);

    // Try to access admin-only route
    const res = await agent.get('/api/v1/users/');
    expect(res.status).toBe(403);
  });

  it('[S01] valid role is accepted', async () => {
    const agent = supertest.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ username: 'sysadmin1', password: DEMO_PASSWORD })
      .expect(200);

    const res = await agent.get('/api/v1/users/');
    expect(res.status).toBe(200);
  });
});
