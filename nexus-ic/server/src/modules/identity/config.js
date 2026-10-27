// DEMO defaults, not from source; set by AICTE policy.
export const config = {
  otpLifetimeMs: 5 * 60_000,
  otpAttempts: 5,
  rateWindowMs: 60_000,
  loginLimit: 30,
  verificationLimit: 10,
  otpLimit: 10,
  revealLifetimeMs: 5 * 60_000,
  revealApproverRoles: ['supervisor', 'competent_authority'],
  retentionPeriodMs: null, // POLICY_NOT_CONFIGURED: no retention period invented.
};
export const demoMode = () => process.env.APP_MODE === 'demo';
