import React from 'react';
import { useS5 } from '../closure/api.jsx';
import { CodeText } from '../../components/ui/PageKit.jsx';

/**
 * Attention-indicator radar (E07 hint, S6 evidence "Radar"): counts per
 * indicator reason from Institution 360. Not a score. UNKNOWN axes are drawn
 * as gaps and labelled UNKNOWN, never as zero.
 */
export default function InstitutionRadar({ pid }) {
  const q = useS5(`/graph/institutions/${pid}/radar`);
  if (!q.data) return null;
  const { axes, note } = q.data;
  const max = Math.max(1, ...axes.map((a) => a.value || 0));
  const n = Math.max(axes.length, 3);
  const point = (i, r) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [150 + r * Math.cos(angle), 150 + r * Math.sin(angle)];
  };
  const known = axes.map((a, i) => (a.value === null ? null : point(i, (a.value / max) * 110)));
  return (
    <section aria-label="Attention indicators radar" className="border rounded p-3 bg-white">
      <h2 className="font-semibold">Attention indicators</h2>
      <p className="text-xs">{note}</p>
      <svg role="img" aria-label="Attention radar" viewBox="0 0 300 300" className="w-72">
        {axes.map((a, i) => {
          const [x, y] = point(i, 120);
          return (
            <g key={a.type}>
              <line x1="150" y1="150" x2={x} y2={y} stroke="#cbd5e1" />
              <text x={x} y={y} fontSize="10" textAnchor="middle">{a.label}: {a.value === null ? 'UNKNOWN' : a.value}</text>
            </g>
          );
        })}
        {known.filter(Boolean).length >= 2 && <polygon points={known.filter(Boolean).map((p) => p.join(',')).join(' ')} fill="#f59e0b55" stroke="#b45309" />}
      </svg>
      <ul className="text-xs">{axes.map((a) => <li key={a.type}>{a.label}: <CodeText value={a.reason} /></li>)}</ul>
    </section>
  );
}
