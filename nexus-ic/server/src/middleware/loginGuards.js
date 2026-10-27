// Middleware that runs before the login handler, in order.
// S1a appends its login rate limiter here: one import line and one array entry.
const loginGuards = [];
export default loginGuards;
import { loginLimiter } from '../modules/identity/rateLimit.js';
loginGuards.push(loginLimiter);
