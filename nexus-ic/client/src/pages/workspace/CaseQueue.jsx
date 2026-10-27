import React from 'react';
import Workload from '../../additions/n89-workload/Workload.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import OfficerWorkspace from './OfficerWorkspace.jsx';
import { PageHeader } from '../../components/ui/PageKit.jsx';

/** Bureau/Cell queue at /cases (SPEC 12.1): assigned cases and coordination (with /sync). */
export default function CaseQueue() {
  const { user } = useAuth();
  return (
    <div className="max-w-6xl mx-auto space-y-3">
      <PageHeader eyebrow="ACCOUNTABLE CASEWORK" title="Bureau / Cell queue" purpose="Find assigned cases, review SLA targets and coordinate the next action with the responsible office." />
      <p className="text-sm">Coordination with other bureaus: <Link className="underline" to="/sync">NEXUS SYNC</Link>.</p>
      <OfficerWorkspace />
      {['supervisor','bureau_officer'].includes(user?.role) && <Workload />}
    </div>
  );
}
