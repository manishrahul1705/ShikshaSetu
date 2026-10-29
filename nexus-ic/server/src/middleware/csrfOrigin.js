import { isAllowedOrigin } from './clientOrigins.js';

// SameSite=lax plus exact Origin/Referer checks for state-changing requests.
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

export default function csrfOrigin(req, res, next) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  if (!origin && !referer) return next();
  let source = origin;
  if (!source) {
    try { source = new URL(referer).origin; } catch { source = null; }
  }
  if (isAllowedOrigin(source)) return next();
  return res.status(403).json({ error: 'CSRF_ORIGIN_MISMATCH' });
}
