import React from 'react';
import CoordinationBanner from '../../additions/n103-coordination/CoordinationBanner.jsx';
import { useParams, Link } from 'react-router-dom';
import { useS5 } from '../closure/api.jsx';
import InstitutionRadar from './InstitutionRadar.jsx';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader } from '../../components/ui/PageKit.jsx';

/**
 * Institution graph (S6 evidence "Graph"): institution, visible cases, owning
 * bureaus and NEXUS TRACE transfer edges from the existing authorized graph API.
 */
const COLORS = { institution: '#1e3a8a', case: '#0f766e', bureau: '#b45309' };

export function layout(nodes) {
  const columns = { case: [], institution: [], bureau: [] };
  for (const n of nodes) columns[n.type]?.push(n);
  const pos = {};
  const x = { case: 90, institution: 300, bureau: 510 };
  for (const [type, list] of Object.entries(columns)) list.forEach((n, i) => { pos[n.id] = { x: x[type], y: 40 + i * 90 }; });
  const height = Math.max(120, ...Object.values(columns).map((l) => 40 + l.length * 90));
  return { pos, height };
}

export function flowData(graph) {
  const { pos } = layout(graph.nodes);
  return {
    nodes: graph.nodes.map(node => ({ id: node.id, position: pos[node.id] || { x: 0, y: 0 },
      data: { label: <span><strong className="block text-xs uppercase">{node.type}</strong>{node.label}</span> },
      ariaLabel: `${node.type}: ${node.label}`, style: { borderColor: COLORS[node.type], borderWidth: 2, opacity: node.opaque ? 0.5 : 1, width: 180 },
    })),
    edges: graph.edges.map((edge, index) => ({ id: `edge-${index}`, source: edge.from, target: edge.to,
      label: edge.kind, markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: edge.kind === 'transfer' ? '#dc2626' : '#64748b', strokeDasharray: edge.kind === 'transfer' ? '4 3' : undefined },
    })),
  };
}

export function InstitutionGraphView({ pid }) {
  const q = useS5(`/graph/institutions/${pid}`);
  if (q.isLoading) return <p>Loading...</p>;
  if (q.error || !Array.isArray(q.data?.nodes) || !Array.isArray(q.data?.edges)) return <p>The graph is unavailable.</p>;
  const g = q.data;
  const data = flowData(g);
  const interactive = typeof ResizeObserver !== 'undefined' && typeof DOMMatrixReadOnly !== 'undefined';
  const { pos, height } = layout(g.nodes);
  return <section aria-label="Institution graph" className="space-y-2">
    <p className="text-xs">Institution, cases and bureaus; dashed red edges are transfers. Restricted entries: {g.restrictedEntries}.</p>
    {interactive ? <div role="img" aria-label="Institution graph" style={{ height: 440, width: '100%' }} className="bg-white border rounded">
      <ReactFlow nodes={data.nodes} edges={data.edges} fitView nodesDraggable={false} nodesConnectable={false} minZoom={0.2} maxZoom={2}>
        <Background /><Controls showInteractive={false} />
      </ReactFlow>
    </div> : <>
      <p className="text-xs">Interactive graph unavailable in this browser; the same authorized relationships are shown below.</p>
      <svg role="img" aria-label="Institution graph" viewBox={`0 0 750 ${height}`} className="w-full bg-white border rounded">
        {g.edges.map((edge, index) => pos[edge.from] && pos[edge.to] ? <line key={index} x1={pos[edge.from].x} y1={pos[edge.from].y} x2={pos[edge.to].x} y2={pos[edge.to].y} stroke={edge.kind === 'transfer' ? '#dc2626' : '#64748b'} strokeDasharray={edge.kind === 'transfer' ? '4 3' : undefined} /> : null)}
        {g.nodes.map(node => <g key={node.id}><circle cx={pos[node.id]?.x || 0} cy={pos[node.id]?.y || 0} r={8} fill={COLORS[node.type]} /><text x={(pos[node.id]?.x || 0) + 12} y={(pos[node.id]?.y || 0) + 4} fontSize={11}>{node.label}</text></g>)}
      </svg>
    </>}
  </section>;
}

function GraphCoordinationBanner({ pid }) {
  const {user}=useAuth();
  const allowed=['bureau_officer','regional_officer','supervisor','competent_authority'].includes(user?.role);
  const q = useS5(`/prevent/overlaps?institutionPid=${encodeURIComponent(pid)}`,allowed);
  if(!allowed)return null;
  if (q.isLoading) return <p role="status">Loading coordination view...</p>;
  if (q.error || !Array.isArray(q.data?.pairs) || q.data.result === 'UNKNOWN') return <p role="status">UNKNOWN: coordination feed unavailable.</p>;
  if (!q.data.pairs.length && !q.data.restrictedCount) return null;
  return <aside role="status" className="bg-amber-50 border border-amber-300 rounded p-4">
    <h2 className="font-bold">Potential Overlapping Cases – Coordination Required</h2>
    <p>Two bureaus can coordinate before asking for the same thing.</p>
    <Link className="underline" to="/review">PREVENT review</Link>
  </aside>;
}

export default function InstitutionGraph() {
  const { pid } = useParams();
  const {user}=useAuth();
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <GraphCoordinationBanner pid={pid} />
      <CoordinationBanner pid={pid} />
      <PageHeader eyebrow="INSTITUTION RELATIONSHIPS" title="Institution graph" purpose="Inspect institution, case and bureau relationships within your access scope." />
      <p className="id-pill">{user?.role==='system_admin'?pid:<Link className="underline" to={`/institutions/${pid}`}>{pid}</Link>}</p>
      <InstitutionGraphView pid={pid} />
      <InstitutionRadar pid={pid} />
    </div>
  );
}
