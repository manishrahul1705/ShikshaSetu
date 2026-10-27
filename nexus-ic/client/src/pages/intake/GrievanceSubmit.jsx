import React, { useState, useEffect } from 'react';
import RedressalStep from '../../additions/n88-first-redressal/RedressalStep.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../i18n/index.js';
import QuickExitButton from '../../components/QuickExitButton.jsx';
import PreventPanel from '../prevent/PreventPanel.jsx';
import { isStandalone } from '../../pwa/display.js';
import InstitutionPicker from '../../components/InstitutionPicker.jsx';
import { metadataLabel } from '../../components/metadataLabel.js';

/**
 * Optional hooks (N15, U15) so another channel reuses this exact form, preview and PREVENT flow:
 * initialDraft prefills the form; onPreview(payload) runs after the draft is validated;
 * onConfirm() replaces the web submit (for example the EMAIL confirmation); allowUploads=false
 * hides the upload control. Without props the page behaves as before.
 */
export default function GrievanceSubmit({ initialDraft = null, onPreview = null, onConfirm = null, allowUploads = true } = {}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Verification status check
  const [verificationChecking, setVerificationChecking] = useState(true);
  const [isUserVerified, setIsUserVerified] = useState(false);

  // Form state
  const [pid, setPid] = useState(initialDraft?.institutionPid || '');
  const [pidSearching, setPidSearching] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [institutionError, setInstitutionError] = useState('');
  const [showManualPid, setShowManualPid] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialDraft?.category || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState(initialDraft?.subCategory || '');
  const [isSensitive, setIsSensitive] = useState(false);

  const [narrative, setNarrative] = useState(initialDraft?.narrative || '');
  const [detectedLang, setDetectedLang] = useState('en');

  const [files, setFiles] = useState([]);
  const [institutionRedressal, setInstitutionRedressal] = useState({});
  const [uploadedDocIds, setUploadedDocIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Two-step flow: edit vs preview
  const [step, setStep] = useState('edit'); // 'edit' | 'preview' | 'success'
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdCase, setCreatedCase] = useState(null);

  // 1. Check user verification status on mount
  useEffect(() => {
    async function checkVerification() {
      try {
        const res = await fetch('/api/v1/identity/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'verified') {
            setIsUserVerified(true);
          }
        }
      } catch (err) {
        console.error('Failed to check reporter status:', err);
      } finally {
        setVerificationChecking(false);
      }
    }
    checkVerification();
  }, []);

  // 2. Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/v1/grievances/categories', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Prefilled draft: fetch the institution profile for its PID once (same read-only lookup as the button).
  useEffect(() => {
    if (initialDraft?.institutionPid) handleLookupPid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update sensitive category flag
  useEffect(() => {
    const cat = categories.find((c) => c.name === selectedCategory);
    if (cat) {
      setIsSensitive(Boolean(cat.sensitive));
    } else {
      setIsSensitive(false);
    }
  }, [selectedCategory, categories]);

  // Handle PID auto-lookup
  const handleLookupPid = async () => {
    if (!pid.trim()) return;
    setPidSearching(true);
    setInstitutionError('');
    setInstitution(null);

    try {
      const res = await fetch(`/api/v1/registry/institutions/${encodeURIComponent(pid.trim())}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setInstitution(data);
      } else {
        const err = await res.json();
        setInstitutionError(err.error || t('institutionNotFound'));
      }
    } catch {
      setInstitutionError(t('institutionNotFound'));
    } finally {
      setPidSearching(false);
    }
  };

  // Handle file selection and upload
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploadError('');
    setUploading(true);

    try {
      const newDocIds = [...uploadedDocIds];
      const newFiles = [...files];

      for (const file of selectedFiles) {
        // Read file to base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            const b64 = result.split(',')[1];
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Call document upload API
        const uploadRes = await fetch('/api/v1/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            bufferBase64: base64,
            originalName: file.name,
            mimeType: file.type,
          }),
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || 'Failed to upload document');
        }

        const uploaded = await uploadRes.json();
        newDocIds.push(uploaded.documentId);
        newFiles.push({
          id: uploaded.documentId,
          name: uploaded.originalName,
          hash: uploaded.originalHash,
          stripped: uploaded.metadataStripped,
        });
      }

      setUploadedDocIds(newDocIds);
      setFiles(newFiles);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Preview step: validates draft
  const handlePreview = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!institution) {
      setSubmitError('Please look up and select a verified institution PID');
      return;
    }
    if (!selectedCategory || !selectedSubCategory || !narrative.trim()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch('/api/v1/grievances/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          institutionPid: institution.pid,
          category: selectedCategory,
          subCategory: selectedSubCategory,
          narrative,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.code === 'VERIFICATION_REQUIRED') {
          setIsUserVerified(false);
        }
        throw new Error(err.error || 'Failed to validate grievance draft');
      }

      const draft = await res.json();
      setDetectedLang(draft.grievance.languageTag);
      if (onPreview) await onPreview({ institutionPid: institution.pid, category: selectedCategory, subCategory: selectedSubCategory, narrative });
      setStep('preview');
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  // Confirm and submit final grievance
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      if (onConfirm) {
        setCreatedCase(await onConfirm());
        setStep('success');
        return;
      }
      const res = await fetch('/api/v1/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Standalone': isStandalone() ? 'true' : 'false' },
        credentials: 'include',
        body: JSON.stringify({
          institutionPid: institution.pid,
          category: selectedCategory,
          subCategory: selectedSubCategory,
          narrative,
          documentIds: uploadedDocIds,
          institutionRedressal,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit grievance');
      }

      const data = await res.json();
      setCreatedCase(data);
      setStep('success');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick exit reset helper
  const handleQuickExit = () => {
    setNarrative('');
    setFiles([]);
    setUploadedDocIds([]);
    setInstitution(null);
  };

  if (verificationChecking) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-slate-500 font-medium">
        Loading intake system...
      </div>
    );
  }

  // N13 Guardrail: Only verified users can submit grievances
  if (!isUserVerified) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-amber-300 rounded-xl p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-lg text-amber-700">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('verificationRequiredTitle')}</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {t('verificationRequiredMessage')}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Link
                to="/verify"
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
              >
                {t('goToVerification')}
              </Link>
              <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success view
  if (step === 'success' && createdCase) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-emerald-200 rounded-xl p-8 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t('submissionSuccess')}</h2>
        <p className="mt-2 text-sm text-slate-600">{t('caseCreatedNotice')}</p>

        <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-lg inline-block text-left w-full max-w-md">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('masterCaseIdLabel')}</div>
          <div className="text-2xl font-mono font-bold text-blue-900 mt-1">{createdCase.masterCaseId}</div>
          <div className="mt-3 text-xs text-slate-500">
            PID: <span className="font-mono font-semibold text-slate-700">{createdCase.institutionPid}</span> • Status: <span className="font-semibold text-emerald-700">{createdCase.status}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-2">
          <Link
            to={`/track/${createdCase.masterCaseId}`}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
          >
            {t('trackGrievance')}
          </Link>
          <button
            onClick={() => {
              setStep('edit');
              setCreatedCase(null);
              setNarrative('');
              setFiles([]);
              setUploadedDocIds([]);
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-all"
          >
            File Another Grievance
          </button>
        </div>
      </div>
    );
  }

  // Preview step
  if (step === 'preview') {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <PreventPanel draft={{ institutionPid: institution.pid, institutionIcid: institution.icid, category: selectedCategory, subCategory: selectedSubCategory, narrative }} onContinue={handleConfirmSubmit} onCancel={() => setStep('edit')} />
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('previewAndConfirm')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Please review your submission carefully before confirmation</p>
          </div>
          {isSensitive && <QuickExitButton onExit={handleQuickExit} />}
        </div>

        {submitError && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {submitError}
          </div>
        )}

        <div className="space-y-6 text-sm">
          {/* Institution Preview */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">{t('institutionDetails')}</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">PID:</span> <span className="font-mono font-semibold">{institution.pid}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('icidLabel')}:</span> <span className="font-semibold">{institution.icid || t('notAvailable')}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">{t('institutionName')}:</span> <span className="font-semibold text-slate-900">{institution.name}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('region')}:</span> <span className="font-semibold">{institution.region}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('stateDistrict')}:</span> <span className="font-semibold">{institution.state}</span>
              </div>
            </div>
          </div>

          {/* Grievance Details Preview */}
          <div>
            <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Complaint Classification</h3>
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">{t('category')}:</span> <span className="font-semibold">{selectedCategory}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('subCategory')}:</span> <span className="font-semibold">{metadataLabel(selectedSubCategory)}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-slate-500">Language detected:</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-semibold rounded uppercase">
                  {detectedLang}
                </span>
              </div>
            </div>
          </div>

          {/* Narrative Preview */}
          <div>
            <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">{t('narrative')}</h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 whitespace-pre-wrap text-slate-800 text-xs leading-relaxed font-sans">
              {narrative}
            </div>
          </div>

          {/* Documents Preview */}
          {files.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">{t('supportingDocs')}</h3>
              <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-slate-50 text-xs">
                {files.map((f, i) => (
                  <li key={i} className="p-3 flex items-center justify-between">
                    <span className="font-medium text-slate-700">{f.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">SHA-256: {f.hash.slice(0, 16)}...</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep('edit')}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition-colors"
          >
            {t('editGrievance')}
          </button>
          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
          >
            {submitting ? t('submitting') : t('confirmAndSubmit')}
          </button>
        </div>
      </div>
    );
  }

  // Edit form step
  const subCategoryOptions =
    categories.find((c) => c.name === selectedCategory)?.subCategories || [];

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
      {/* Header with Quick Exit */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('grievanceTitle')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('grievanceSubtitle')}</p>
        </div>
        {isSensitive && (
          <div className="flex flex-col items-end">
            <QuickExitButton onExit={handleQuickExit} />
            <span className="text-[10px] text-red-600 mt-1 font-medium">Sensitive topic mode active</span>
          </div>
        )}
      </div>

      {submitError && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {submitError}
        </div>
      )}

      <form onSubmit={handlePreview} className="space-y-6">
        <RedressalStep value={institutionRedressal} onChange={setInstitutionRedressal} />
        <InstitutionPicker showDetails onSelect={row => {
          setPid(row.pid);
          setInstitution(row);
          setInstitutionError('');
        }} />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowManualPid(v => !v)}
            className="text-xs text-saffron-700 hover:text-saffron-800 underline font-medium"
          >
            {showManualPid ? 'Hide manual PID entry' : 'Or enter PID directly instead'}
          </button>
        </div>
        {showManualPid && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('enterPid')} *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pid}
                onChange={(e) => setPid(e.target.value)}
                placeholder={t('pidPlaceholder')}
                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleLookupPid}
                disabled={pidSearching || !pid.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {pidSearching ? 'Searching...' : t('fetchDetails')}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Exact match only. Format: 1-XXXXXXXXXX (e.g. 1-1234567890).
            </p>
          </div>
        )}
        {institutionError && (
          <p className="text-xs text-red-600 font-medium">{institutionError}</p>
        )}
        {institution && (
          <div className="p-4 bg-saffron-50/60 border border-saffron-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink-950 text-sm">{institution.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-bharat-100 text-bharat-800 font-semibold rounded text-[11px]">
                  {institution.approvalStatus || 'APPROVED'}
                </span>
                <span className={`px-2 py-0.5 font-semibold rounded text-[11px] ${institution.icidCheck === 'MATCH' ? 'bg-bharat-50 text-bharat-700 border border-bharat-200' : institution.icidCheck === 'IDENTITY_REVIEW' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                  ICID: {institution.icidCheck || (institution.icid ? 'MATCH' : 'NOT AVAILABLE')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-700 pt-1 border-t border-saffron-100">
              <div><span className="text-slate-500 block">PID:</span><span className="font-mono font-bold text-ink-900">{institution.pid}</span></div>
              <div><span className="text-slate-500 block">Region:</span><span className="font-semibold text-ink-900">{institution.region}</span></div>
              <div><span className="text-slate-500 block">State:</span><span className="font-semibold text-ink-900">{institution.state}</span></div>
              <div><span className="text-slate-500 block">Type:</span><span className="text-ink-900">{institution.type || 'Engineering & Tech'}</span></div>
            </div>
          </div>
        )}
        {/* Category & Subcategory selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t('category')} *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubCategory('');
              }}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-800 focus:outline-none"
              required
            >
              <option value="">-- {t('categorySelect')} --</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} {c.sensitive ? '⚠️ (Sensitive)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t('subCategory')} *
            </label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-800 focus:outline-none disabled:bg-slate-100"
              required
            >
              <option value="">-- {t('subCategorySelect')} --</option>
              {subCategoryOptions.map((sub) => (
                <option key={sub} value={sub}>
                  {metadataLabel(sub)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Narrative input with local multilingual note (N67) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            {t('narrative')} *
          </label>
          <textarea
            rows="5"
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder={t('narrativePlaceholder')}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-800 focus:outline-none"
            required
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {t('narrativeHelp')}
          </p>
        </div>

        {/* Document upload (N31, N52, S12) */}
        {allowUploads && <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            {t('supportingDocs')}
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {t('uploadDocs')}
          </p>

          {uploading && <p className="text-xs text-blue-700 font-medium mt-1">Scanning and encrypting upload...</p>}
          {uploadError && <p className="text-xs text-red-600 font-medium mt-1">{uploadError}</p>}

          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="font-medium text-slate-700">{f.name}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    ✓ Encrypted (AES-256-GCM) {f.stripped ? '• EXIF Scrubbed' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-all"
          >
            {t('previewAndConfirm')}
          </button>
        </div>
      </form>
    </div>
  );
}
