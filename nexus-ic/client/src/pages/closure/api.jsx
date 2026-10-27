import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// S5 API helper. Session cookie only (S16); nothing is stored client-side.
export async function s5Request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(result.error || 'REQUEST_FAILED');
    err.details = result.details;
    err.status = response.status;
    throw err;
  }
  return result;
}

export function useS5(path, enabled = true, options = {}) {
  const extra = typeof enabled === 'object' ? enabled : options;
  const isEnabled = typeof enabled === 'boolean' ? enabled : true;
  return useQuery({ queryKey: ['s5', path], queryFn: () => s5Request(path), enabled: isEnabled, retry: false, gcTime: 0, ...extra });
}

export function useS5Action(path, method = 'POST', invalidate = []) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body) => s5Request(typeof path === 'function' ? path(body) : path, { method, body: body?.payload ?? body }),
    onSettled: () => invalidate.forEach((p) => client.invalidateQueries({ queryKey: ['s5', p] })),
  });
}

export const S5_SYNTHETIC = 'SYNTHETIC DATA';

export function Pct({ p }) {
  if (!p) return null;
  if (p.value === null || p.value === undefined) return <span>UNKNOWN ({p.reason || 'NO_DENOMINATOR'}), {p.numerator}/{p.denominator}, {p.scope}</span>;
  return <span>{p.value}% ({p.numerator} of {p.denominator}; scope: {p.scope})</span>;
}

export function ErrorLine({ error }) {
  if (!error) return null;
  return <p role="alert" className="text-sm text-red-700">{error.message}</p>;
}
