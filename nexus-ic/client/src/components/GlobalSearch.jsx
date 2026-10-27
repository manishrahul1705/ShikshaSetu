import React from 'react';
import { useNavigate } from 'react-router-dom';
import InstitutionPicker from './InstitutionPicker.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function classify(q) {
  const v = q.trim();
  if (/^NX-\d{4}-\d{6}$/i.test(v)) return { kind: 'case', value: v.toUpperCase() };
  if (/^1-\d{10}$/.test(v)) return { kind: 'pid', value: v };
  if (v) return { kind: 'icid', value: v };
  return null;
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reporter = ['student', 'faculty', 'other_stakeholder'].includes(user?.role);
  return <div className="relative w-full max-w-sm"><InstitutionPicker
    onCaseId={id => navigate('/' + (reporter ? 'track' : 'cases') + '/' + id)}
    onSelect={row => navigate('/institutions/' + encodeURIComponent(row.pid))} /></div>;
}
