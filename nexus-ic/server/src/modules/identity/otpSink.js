// Ephemeral demo inbox only. Never store plaintext OTPs in a database.
export const otpInbox = new Map();
export const clearOtpInbox = (userId) => otpInbox.delete(String(userId));
