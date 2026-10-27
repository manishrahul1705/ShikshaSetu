/**
 * Safe logger (S28): strips or refuses known complainant/identity fields.
 *
 * Protected fields: narrative, description, name, email, phone, enrolment, identityPayload.
 * Any object passed to the logger has these fields replaced with "[REDACTED]".
 * Any plain string argument longer than 80 characters is replaced with "[REDACTED-STRING]"
 * to prevent leaking narrative or complaint free-text via string concatenation.
 * This is the ONLY logger used in the codebase.
 */

const PROTECTED_FIELDS = [
  'narrative',
  'description',
  'name',
  'email',
  'phone',
  'enrolment',
  'identityPayload',
];

const MAX_STRING_LENGTH = 80;

function sanitize(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PROTECTED_FIELDS.includes(key)) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function formatArgs(args) {
  return args.map((arg) => {
    if (typeof arg === 'string') {
      if (arg.length > MAX_STRING_LENGTH) {
        return '[REDACTED-STRING]';
      }
      return arg;
    }
    if (typeof arg === 'object' && arg !== null) {
      return sanitize(arg);
    }
    return arg;
  });
}

const logger = {
  info(...args) {
    console.log('[INFO]', ...formatArgs(args));
  },
  warn(...args) {
    console.warn('[WARN]', ...formatArgs(args));
  },
  error(...args) {
    console.error('[ERROR]', ...formatArgs(args));
  },
  debug(...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[DEBUG]', ...formatArgs(args));
    }
  },
  /** Exposed for testing */
  _sanitize: sanitize,
  _formatArgs: formatArgs,
  _PROTECTED_FIELDS: PROTECTED_FIELDS,
  _MAX_STRING_LENGTH: MAX_STRING_LENGTH,
};

export default logger;
