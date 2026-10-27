import React from 'react';
import { Link } from 'react-router-dom';
import { useS5 } from '../closure/api.jsx';
import { PageHeader, EmptyState, CodeText } from '../../components/ui/PageKit.jsx';

/** Notification centre (SPEC 12.1): in-app notices; email and SMS go to the simulators (SMS sandbox until approved). */
export default function Notifications() {
  const q = useS5('/notifications');
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error) return <p>Notifications are unavailable.</p>;
  const n = q.data;
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <PageHeader eyebrow="YOUR WORKSPACE" title="Notifications" purpose="Updates and requests that need your attention." />
      <p className="text-xs text-ink-500">Email and SMS delivery: sandbox</p>
      {n.items.length === 0 && <EmptyState icon="bell" title="You are up to date" text="New case updates and requests will appear here." to="/dashboard" action="Open command centre" />}
      <ul className="space-y-2">
        {n.items.map((i, k) => (
          <li key={k} className="card card-pad text-sm">
            <span className="text-xs font-bold mr-2"><CodeText value={i.kind} /></span>{i.text} <Link className="underline ml-1" to={i.link}>Open</Link>
            <span className="block text-xs text-slate-500">{new Date(i.at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
