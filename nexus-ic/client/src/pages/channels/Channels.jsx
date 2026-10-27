import React from 'react';
import {Link} from 'react-router-dom';
import {useI18n} from '../../i18n/index.js';
import {PageHeader} from '../../components/ui/PageKit.jsx';
import Icon from '../../components/ui/Icon.jsx';
export default function Channels() {
 const {t}=useI18n();
 return <main className="max-w-4xl mx-auto space-y-6"><PageHeader eyebrow="ONE CASE JOURNEY" title={t('s6aChannels')} purpose="Choose how to prepare your grievance. Verification, review and confirmation stay part of the same accountable case journey." />
 <div className="grid gap-4 sm:grid-cols-2"><section className="card card-pad space-y-4"><Icon name="globe" className="h-7 w-7 text-ink-700" /><h2 className="card-title">Web portal</h2><p className="text-sm text-ink-500">Choose your institution, describe the concern, review related matters and confirm your submission.</p><Link className="btn-primary" to="/grievances/new">{t('s6aWeb')}</Link></section><section className="card card-pad space-y-4"><Icon name="inbox" className="h-7 w-7 text-ink-700" /><h2 className="card-title">Email intake</h2><p className="text-sm text-ink-500">{t('s6aEmailNote')}</p><Link className="btn-primary" to="/my/email-drafts">{t('s6aMyEmailDrafts')}</Link></section></div>
 <section className="card card-pad space-y-3"><h2 className="card-title">Use the portal on your phone</h2><p className="text-sm">{t('s6aPwa')}</p><p className="text-xs text-ink-500">{t('s6aNative')}</p></section>
 <Link className="btn-secondary" to="/integrity">{t('s6aIntegrity')}</Link></main>;
}
