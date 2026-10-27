// Authentication roles only. Identity data must never be added to User.
export default function userIdentityPlugin(schema) {
  for (const role of ['other_stakeholder']) {
    if (!schema.path('role').enumValues.includes(role)) schema.path('role').enumValues.push(role);
  }
}
