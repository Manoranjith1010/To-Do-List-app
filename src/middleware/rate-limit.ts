import rateLimit from 'express-rate-limit';

/**
 * Throttles unauthenticated auth endpoints to slow credential-stuffing and
 * brute-force attacks. Keyed by client IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts, please try again later',
    },
  },
});
