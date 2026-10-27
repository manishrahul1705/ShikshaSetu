/**
 * User Absence Schema Plugin (ADDITIONS.md N60)
 */
export default function userAbsencePlugin(schema) {
  schema.add({
    isOnLeave: {
      type: Boolean,
      default: false,
    },
    leaveDetails: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      reason: { type: String, default: null },
      markedAt: { type: Date, default: null },
    },
  });
}
