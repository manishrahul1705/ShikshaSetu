import React from 'react';
import { StatCard } from '../../components/dashboard/CommandCharts.jsx';
import { codeLabel } from '../../components/ui/PageKit.jsx';
export default function AdditionalCards({ tiles, share }) {
  return <>{[['underProcessCases', 'Under process', 'clock'], ['transferredCases', 'Transferred', 'shuffle'], ['escalatedCases', 'Escalated', 'alert']].map(([key, label, icon]) =>
    <StatCard key={key} icon={icon} label={label} value={tiles?.[key]?.count} sub={share(tiles?.[key]?.share) || (tiles?.[key]?.reason ? codeLabel(tiles[key].reason) : null)} to={`/impact/cases?row=${encodeURIComponent('tile:' + key)}`} />)}
  </>;
}
