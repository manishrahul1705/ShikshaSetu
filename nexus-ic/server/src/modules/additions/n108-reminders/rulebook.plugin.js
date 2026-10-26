export default function reminderRulePlugin(schema) {
  if (!schema.path('family').enumValues.includes('PENDING_REMINDER')) schema.path('family').enum('PENDING_REMINDER');
}
