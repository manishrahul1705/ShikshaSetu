export async function request(path, body) {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', cache: 'no-store', ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'CHANNEL_UNAVAILABLE');
  return data;
}
