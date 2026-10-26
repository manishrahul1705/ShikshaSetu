export default function institutionAddressPlugin(schema) {
  schema.add({ address: { type: String, default: null } });
}
