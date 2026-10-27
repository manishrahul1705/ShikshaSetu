import env from '../config/env.js';

/**
 * CSRF defence for cookie sessions (S7 hardening, alongside SameSite=lax).
 * A state-changing request that a browser marks with an Origin (or Referer) from another site
 * is refused. Requests without either header come from non-browser clients and carry no
 * ambient cookie risk from a third-party page. Outside production mode any loopback origin
 * (localhost, 127.0.0.1, [::1], any port) is also accepted, because Vite may serve the dev app
 * on another port or the browser may use 127.0.0.1; a remote site can never send one of these.
 */
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

function isLoopback(origin) {
  try {
    const u = new URL(origin);
    return (u.protocol === 'http:' || u.protocol === 'https:') && LOOPBACK.has(u.hostname);
  } catch {
    return false;
  }
}

function originOf(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export default function csrfOrigin(req, res, next) {
  if (SAFE.has(req.method)) return next();
  const source = req.get('Origin') || (req.get('Referer') ? originOf(req.get('Referer')) : null);
  if (!source) return next();
  const allowed = new Set([originOf(env.CLIENT_ORIGIN), `${req.protocol}://${req.get('host')}`]);
  if (allowed.has(source)) return next();
  if ((process.env.APP_MODE || env.APP_MODE) !== 'production' && isLoopback(source)) return next();
  return res.status(403).json({ error: 'CSRF_ORIGIN_MISMATCH' });
}
