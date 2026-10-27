import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.jsx';
export async function request(path, body) {
  const response = await fetch(`/api/v1${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'include', cache: 'no-store', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'PREVENT_UNAVAILABLE');
  return result;
}
export function usePreventQuery(path, enabled = true) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['s4', user?.id, path], queryFn: () => request(path), enabled: !!user && enabled, refetchInterval: 15_000, gcTime: 0, retry: false });
}
export const OFFICERS = ['supervisor', 'competent_authority', 'regional_officer', 'bureau_officer'];
