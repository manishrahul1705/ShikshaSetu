import { getActiveRule } from '../rulebook/index.js';
import Case from '../cases/Case.js';
import { recordAudit } from '../audit/audit.js';
import { updateCasePriorityAndClock } from './priorityService.js';

/**
 * Scan complaint text and category for sensitivity triggers (N19, U18)
 *
 * Runs locally on original text without any outside cloud service.
 * Supports scheduled languages: English, Hindi, Tamil.
 */
export async function detectSensitivity(narrative, category) {
  const flags = [];
  const text = (narrative || '').toLowerCase();

  // 1. Category check
  if (category && /ragging|safety|harassment|assault/i.test(category)) {
    flags.push({
      flag: 'CATEGORY_SENSITIVE',
      keyword: category,
      detectedAt: new Date(),
      status: 'SUGGESTED',
    });
  }

  // 2. Keyword check from RuleBook
  const rule = await getActiveRule('SENSITIVITY');
  const keywordsByLang = rule?.body?.keywords || {
    en: ['ragging', 'sexual harassment', 'harassment', 'suicide', 'self-harm', 'extortion', 'threat', 'caste discrimination'],
    hi: ['रैगिंग', 'यौन उत्पीड़न', 'उत्पीड़न', 'आत्महत्या', 'जबरन वसूली', 'धमकी', 'भेदभाव'],
    ta: ['ஏளனம்', 'துன்புறுத்தல்', 'பாலியல் துன்புறுத்தல்', 'தற்கொலை', 'பறித்தல்', 'மிரட்டல்'],
  };

  for (const lang of Object.keys(keywordsByLang)) {
    for (const kw of keywordsByLang[lang]) {
      if (text.includes(kw.toLowerCase())) {
        flags.push({
          flag: 'KEYWORD_MATCH',
          keyword: kw,
          detectedAt: new Date(),
          status: 'SUGGESTED',
        });
      }
    }
  }

  return {
    isSuggestedSensitive: flags.length > 0,
    flags,
  };
}

/**
 * Helper returning matched sensitivity keywords array (N19, U18)
 */
export async function detectSensitivityKeywords(narrative, category) {
  const res = await detectSensitivity(narrative, category);
  return res.flags;
}

/**
 * Human confirmation of sensitive flag (S20, U18)
 *
 * Every sensitive flag is a suggestion until confirmed by an authorized human.
 * Requester separation (S20): Submitter or auto-system cannot self-confirm.
 */
export async function confirmSensitivityFlag(caseId, flagIndex, user, reason) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  // S20: Separated human review
  if (caseDoc.reporterId && user.reporterId && caseDoc.reporterId === user.reporterId) {
    const err = new Error('Complainant cannot confirm their own sensitivity flag (S20)');
    err.status = 403;
    throw err;
  }

  const flags = caseDoc.sensitivityFlags || [];
  if (flagIndex < 0 || flagIndex >= flags.length) {
    const err = new Error('Invalid sensitivity flag index');
    err.status = 400;
    throw err;
  }

  const flag = flags[flagIndex];
  if (flag?.suggestedBy && String(flag.suggestedBy) === String(user._id || user.id)) {
    const err = new Error('Requester cannot confirm their own sensitivity flag (S20)');
    err.status = 403;
    throw err;
  }

  flags[flagIndex].status = 'CONFIRMED';
  flags[flagIndex].confirmedBy = user._id || user.id;
  flags[flagIndex].confirmedAt = new Date();
  caseDoc.sensitivityFlags = flags;

  // Elevate priority to urgent and start a new SLA clock segment under current active RuleBook (U18, U19)
  await updateCasePriorityAndClock(caseDoc, 'urgent', user, `Confirmed sensitivity flag: ${flags[flagIndex].keyword || flags[flagIndex].flag}`);

  await caseDoc.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.sensitivity.confirmed',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      flagIndex,
      keyword: flags[flagIndex].keyword,
      reason: reason || 'Human confirmed sensitive flag',
    },
  });

  return caseDoc;
}

/**
 * Human dismissal of sensitive flag suggestion (U18)
 */
export async function dismissSensitivityFlag(caseId, flagIndex, user, reason) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error('Case not found');
    err.status = 404;
    throw err;
  }

  const flags = caseDoc.sensitivityFlags || [];
  if (flagIndex < 0 || flagIndex >= flags.length) {
    const err = new Error('Invalid sensitivity flag index');
    err.status = 400;
    throw err;
  }

  const flag = flags[flagIndex];
  if (flag?.suggestedBy && String(flag.suggestedBy) === String(user._id || user.id)) {
    const err = new Error('Requester cannot confirm their own sensitivity flag (S20)');
    err.status = 403;
    throw err;
  }

  flags[flagIndex].status = 'DISMISSED';
  flags[flagIndex].dismissalReason = reason || 'Dismissed by officer review';
  caseDoc.sensitivityFlags = flags;
  await caseDoc.save();

  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.sensitivity.dismissed',
    targetType: 'Case',
    targetId: String(caseDoc._id),
    meta: {
      flagIndex,
      keyword: flags[flagIndex].keyword,
      reason,
    },
  });

  return caseDoc;
}
