import crypto from 'node:crypto';
import User from '../auth/User.js';
import { Reporter } from '../identity/models.js';
import AuditEvent from '../audit/AuditEvent.js';
// Simulates a backup job and manifest. It is explicitly not a recoverable backup.
export class BackupSimulator {
  static async run() {
    const counts = { users: await User.countDocuments(), reporters: await Reporter.countDocuments(), auditEvents: await AuditEvent.countDocuments() };
    return { id: crypto.randomUUID(), simulated: true, status: 'completed', recoverable: false, counts, at: new Date() };
  }
}
