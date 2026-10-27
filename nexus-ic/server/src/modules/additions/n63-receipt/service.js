import { trackCase } from '../../track/trackService.js';
import { watermarkExport } from '../n55-watermark/service.js';
import { SYNTHETIC_FOOTER_LINE } from '../n66-integrity-banner/exportFooter.js';

/**
 * N63 Case receipt with QR (ADDITIONS.md).
 *
 * The complainant downloads a receipt with the Master Case ID and status
 * history; the QR opens /track/:caseId, which still needs login (S21). No
 * internal notes. Built from the same own-case view as /track (N29), so the
 * receipt can never show more than the complainant may see.
 */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function trackUrl(masterCaseId) {
  const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');
  return `${origin}/track/${encodeURIComponent(masterCaseId)}`;
}

export async function qrSvg(text) {
  try {
    const mod = await import('qrcode');
    const QRCode = mod.default || mod;
    return { result: 'OK', svg: await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 }) };
  } catch {
    return { result: 'UNKNOWN', reason: 'QR_LIBRARY_NOT_INSTALLED' };
  }
}

export async function buildReceipt(user, caseRef) {
  const view = await trackCase(user, caseRef);
  const url = trackUrl(view.masterCaseId);
  const qr = await qrSvg(url);
  const mark = await watermarkExport(user, { kind: 'CASE_RECEIPT', rowCount: view.statusHistory.length, scope: 'Own case' });
  const rows = view.statusHistory.map((h) => `<tr><td>${esc(h.status)}</td><td>${esc(new Date(h.at).toISOString())}</td></tr>`).join('');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>AWAAZ DASTAK receipt ${esc(view.masterCaseId)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:24px auto;color:#0f172a}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:6px;text-align:left}.banner{background:#fef3c7;padding:6px;font-weight:700}footer{margin-top:16px;font-size:12px;color:#475569}</style></head>
<body>
<h1>AWAAZ DASTAK</h1><p>powered by NEXUS-IC. Every voice, at the right door.</p>
<h2>Case receipt</h2>
<p><strong>Master Case ID:</strong> ${esc(view.masterCaseId)}</p>
<p><strong>Category:</strong> ${esc(view.category)} / ${esc(view.subCategory)}</p>
<p><strong>Current status:</strong> ${esc(view.status)}</p>
<h3>Status history</h3>
<table><thead><tr><th>Status</th><th>Time (UTC)</th></tr></thead><tbody>${rows}</tbody></table>
<h3>Track this case</h3>
<p>Scan or open: <a href="${esc(url)}">${esc(url)}</a>. You will need to log in.</p>
${qr.result === 'OK' ? `<div aria-label="QR code to track this case">${qr.svg}</div>` : `<p>QR code: UNKNOWN (${esc(qr.reason)})</p>`}
<footer>${esc(mark.visible)}${mark.invisible}</footer>
</body></html>
`;
  return { html, url, qr: qr.result === 'OK' ? 'OK' : { result: qr.result, reason: qr.reason }, code: mark.code, masterCaseId: view.masterCaseId };
}
