import { PreventAlert } from './models.js';
import { readCase, uid } from './access.js';
export async function listAlerts(user) {
  const result = [];
  for (const alert of await PreventAlert.find({ recipientId: uid(user) }).sort({ createdAt: -1 }).lean()) {
    try {
      const row = await readCase(user, String(alert.caseId));
      result.push({ id: String(alert._id), caseId: row.masterCaseId, result: alert.result, reasons: alert.reasons, at: alert.createdAt });
    } catch (error) { if (error.status !== 404) throw error; }
  }
  return result;
}
