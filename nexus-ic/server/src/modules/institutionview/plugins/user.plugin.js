/**
 * User plugin (S5, N30): links an Institution Representative (institution_admin)
 * to the one institution they represent, by PID. Read from the database on
 * every institution-workspace request (S01); never taken from the client.
 * Holds no reporter or identity data.
 */
export default function institutionLinkPlugin(schema) {
  schema.add({
    institutionPid: { type: String, default: null, match: /^1-\d{10}$/ },
  });
}
