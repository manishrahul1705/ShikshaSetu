import { metadataLabel } from '../../components/metadataLabel.js';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import { QueueFilter, Pagination } from '../../components/ui/PageKit.jsx';

export default function MyCases() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(''), [page, setPage] = useState(0);
  const rows = cases.filter(c=>[c.masterCaseId,c.pidSnapshot?.name,c.institutionPid,c.category,c.status].join(' ').toLowerCase().includes(search.toLowerCase()));
  const currentPage = Math.min(page, Math.max(0,Math.ceil(rows.length/12)-1));

  useEffect(() => {
    async function fetchMyCases() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/v1/cases/my', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setCases(data);
        } else {
          const err = await res.json();
          setError(err.error || 'Failed to load your cases');
        }
      } catch {
        setError('Network error loading cases');
      } finally {
        setLoading(false);
      }
    }
    fetchMyCases();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Filed Grievances</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status, case details, and documents for grievances filed under your verified pseudonym.
          </p>
        </div>
        <Link
          to="/grievances/new"
          className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-800"
        >
          + Submit New Grievance
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading your cases...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <p className="text-slate-600 font-medium text-sm">
            You have not submitted any grievances yet.
          </p>
          <Link
            to="/grievances/new"
            className="inline-block px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-800"
          >
            Submit your first grievance
          </Link>
        </div>
      ) : (
        <div className="space-y-4"><QueueFilter query={search} setQuery={value=>{setSearch(value);setPage(0);}} /><div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Master Case ID</th>
                <th className="p-3">Institution</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(currentPage*12,currentPage*12+12).map((c) => (
                <tr key={c._id || c.masterCaseId} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-900">
                    <Link
                      to={`/my/cases/${encodeURIComponent(c.masterCaseId)}`}
                      className="hover:underline"
                    >
                      {c.masterCaseId}
                    </Link>
                  </td>
                  <td className="p-3 text-slate-700"><p>{c.pidSnapshot?.name || c.institutionPid}</p><p className="mt-1 font-mono text-xs text-slate-500">{c.institutionPid}</p></td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-900">{c.category}</span>
                    <span className="text-slate-500 text-[11px] block">{metadataLabel(c.subCategory)}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-900 uppercase">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/my/cases/${encodeURIComponent(c.masterCaseId)}`}
                      className="px-3 py-1 bg-slate-100 text-slate-800 font-semibold rounded text-xs hover:bg-slate-200"
                    >
                      View Journey →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div><Pagination page={currentPage} setPage={setPage} total={rows.length} /></div>
      )}
    </div>
  );
}
