export const problemStatementFamilies = ['INSTITUTION_FIRST_REDRESSAL', 'OFFICER_WORKLOAD', 'COMBINED_REQUEST_REPLY', 'INSTITUTION_DOCUMENT_TYPES'];
// Register names only. No regulation, deadline or workload threshold is invented.
export default function problemStatementRules(schema) {
  schema.path('family').enum(...problemStatementFamilies);
}
