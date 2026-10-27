/**
 * S01 Zero-trust authorization middleware.
 *
 * Every request is re-authorized server-side. This middleware checks:
 * 1. A valid session exists (user is authenticated).
 * 2. The user's role is in the allowed roles list (if specified).
 *
 * Usage: router.get('/path', authorize('admin', 'auditor'), handler)
 *        router.get('/path', authorize(), handler)  // any authenticated user
 */
export default function authorize(...allowedRoles) {
  const mw = (req, res, next) => {
    // Check authentication
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check role authorization
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Attach user info to request for downstream use
    req.user = req.session.user;
    next();
  };

  // Mark the middleware so tests can verify it was applied
  mw._isAuthorize = true;
  mw._allowedRoles = allowedRoles;

  return mw;
}
