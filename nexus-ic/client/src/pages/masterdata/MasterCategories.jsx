import { metadataLabel } from '../../components/metadataLabel.js';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import RuleVersion from '../../components/RuleVersion.jsx';

export default function MasterCategories() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / edit state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategories, setNewSubCategories] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/grievances/master/categories', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Failed to load category master data');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setActionError('Reason is required for category master data edit');
      return;
    }
    if (!newCategoryName.trim()) {
      setActionError('Category name is required');
      return;
    }

    setSubmitting(true);
    setActionError('');

    const subCats = newSubCategories
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedCategories = [
      ...(data?.categories || []),
      {
        name: newCategoryName.trim(),
        subCategories: subCats.length ? subCats : ['General'],
        sensitive: isSensitive,
      },
    ];

    try {
      const res = await fetch('/api/v1/grievances/master/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          categories: updatedCategories,
          reason: reason.trim(),
        }),
      });

      if (res.ok) {
        setNewCategoryName('');
        setNewSubCategories('');
        setIsSensitive(false);
        setReason('');
        fetchCategories();
      } else {
        const err = await res.json();
        setActionError(err.error || 'Failed to update categories');
      }
    } catch {
      setActionError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Master Data: Grievance Categories
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Versioned reference table of grievance categories, sub-categories, and sensitive flags.
            </p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs uppercase tracking-wide">
              <RuleVersion value={data?.version || 'DEMO-CATEGORIES-v1'} family="Category rule" />
            </span>
            <div className="text-[10px] text-slate-400 mt-1">Versioned reference</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading categories...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Categories List */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b font-bold text-xs text-slate-700 uppercase tracking-wider flex justify-between">
              <span>Categories ({data?.categories?.length || 0})</span>
              <span>Sensitive Flag</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {data?.categories?.map((cat, idx) => (
                <div key={idx} className="p-4 flex items-start justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{cat.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Subcategories: {cat.subCategories?.map(metadataLabel).join(', ')}
                    </div>
                  </div>
                  <div>
                    {cat.sensitive ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded text-[10px]">
                        Sensitive (Quick-Exit)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded text-[10px]">
                        Standard
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Category Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Add New Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Laboratory Safety"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subcategories (comma-separated)
                </label>
                <input
                  type="text"
                  value={newSubCategories}
                  onChange={(e) => setNewSubCategories(e.target.value)}
                  placeholder="Chemicals, Equipment, Fire Hazards"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sensCheck"
                  checked={isSensitive}
                  onChange={(e) => setIsSensitive(e.target.checked)}
                  className="rounded text-blue-900"
                />
                <label htmlFor="sensCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Mark as Sensitive (requires restricted handling)
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Versioned Edit (Audited)
                </label>
                <textarea
                  rows="2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Mandatory justification for category addition..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              {actionError && (
                <div className="p-2 bg-red-50 text-red-700 text-xs rounded">{actionError}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-blue-900 text-white font-bold text-xs rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {submitting ? 'Creating New Version...' : 'Create Versioned Update'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
