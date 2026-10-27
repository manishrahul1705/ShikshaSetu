import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.js';



export default function PresentStory({ onClose }) {
  const { lang, t } = useI18n();
  const hi = lang === 'hi', slides = t('polish.storySlides');
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(true), [report, setReport] = useState(null);
  const root = useRef(null), close = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    close.current?.focus();
    const abort = new AbortController();
    fetch('/api/v1/impact/summary', { credentials: 'include', signal: abort.signal }).then(r => r.ok ? r.json() : null).then(setReport).catch(() => {});
    const key = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => { abort.abort(); document.removeEventListener('keydown', key); previous?.focus?.(); };
  }, [onClose]);
  useEffect(() => {
    if (!playing || index === slides.length - 1) return;
    const timer = setTimeout(() => setIndex(i => i + 1), 8000);
    return () => clearTimeout(timer);
  }, [index, playing, slides.length]);
  const metrics = [
    [t("polish.Cases"), report?.tiles?.totalComplaints?.count],
    [t("polish.Average resolution days"), report?.resolutionTime?.meanDays],
    [t("polish.Transfers accepted within time"), report?.transfersAcceptedWithinTime?.count],
    [t("polish.Duplicate actions flagged"), report?.duplicateActions?.flagged],
  ];
  return <section ref={root} role="dialog" aria-modal="true" aria-label={t("polish.Guided Walkthrough")}
    className="fixed inset-0 z-[100] flex flex-col overflow-auto bg-ink-950 p-6 text-white sm:p-12"
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const buttons = root.current.querySelectorAll('button:not(:disabled)');
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
    <div className="flex justify-between"><span>AWAAZ DASTAK · {index + 1}/{slides.length}</span><button ref={close} onClick={onClose}>{t("polish.Close")}</button></div>
    <div className="my-auto space-y-8 py-10" aria-live="polite">
      <h1 className="max-w-5xl text-4xl font-extrabold text-white sm:text-6xl">{slides[index][0]}</h1>
      <p className="max-w-4xl text-xl text-ink-100 sm:text-3xl">{slides[index][1]}</p>
      {index === slides.length - 1 && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-white/20 p-5"><p className="text-sm">{label}</p><p className="mt-3 text-4xl font-bold">{value ?? 'UNKNOWN'}</p></div>)}</div>
        <p>{t("polish.Scope")}: {report?.scope || 'UNKNOWN — IMPACT unavailable for this session'}</p>
        {report?.transfersAcceptedWithinTime?.share && <p>{report.transfersAcceptedWithinTime.share.numerator}/{report.transfersAcceptedWithinTime.share.denominator} · {report.transfersAcceptedWithinTime.share.scope}</p>}
        {!report?.resolutionTime?.meanDays && report?.resolutionTime?.meanDays !== 0 && <p>UNKNOWN — {report?.resolutionTime?.reason || 'NO_RECORDED_AVERAGE'}</p>}</>}
    </div>
    <nav className="flex flex-wrap justify-center gap-6" aria-label={t("polish.Presentation controls")}>
      <button disabled={index === 0} onClick={() => setIndex(i => i - 1)}>{t("polish.Previous")}</button>
      <button onClick={() => setPlaying(value => !value)}>{playing ? (t("polish.Pause")) : (t("polish.Play"))}</button>
      <button disabled={index === slides.length - 1} onClick={() => setIndex(i => i + 1)}>{t("polish.Next")}</button>
    </nav>
  </section>;
}
