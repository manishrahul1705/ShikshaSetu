/**
 * User plugin (S5, N80): Competent Authority members as named in roles.png:
 * Chairperson, Member Secretary and Authorized Senior Officials.
 * Only meaningful for role competent_authority.
 */
export const AUTHORITY_DESIGNATIONS = ['Chairperson', 'Member Secretary', 'Authorized Senior Official'];

export default function authorityMemberPlugin(schema) {
  schema.add({
    authorityDesignation: { type: String, enum: [...AUTHORITY_DESIGNATIONS, null], default: null },
  });
}
