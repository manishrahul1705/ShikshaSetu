const fs = require('fs');
const path = require('path');

const actionServicePath = path.resolve('server/src/modules/actions/actionService.js');
let content = fs.readFileSync(actionServicePath, 'utf8');

const targetStr = `  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.action.recorded',
    targetType: 'CaseAction',
    targetId: String(actionDoc._id),
    meta: {
      caseId: String(caseDoc._id),
      masterCaseId: caseDoc.masterCaseId,
      actionType,
      actionSubtype,
      preCheckResult: preCheck?.result || 'UNKNOWN',
    },
  });

  return {
    action: actionDoc,
    preCheck,
    canProceed: true,
  };`;

const replacementStr = `  await recordAudit({
    actorId: String(user._id || user.id),
    actorRole: user.role,
    action: 'case.action.recorded',
    targetType: 'CaseAction',
    targetId: String(actionDoc._id),
    meta: {
      caseId: String(caseDoc._id),
      masterCaseId: caseDoc.masterCaseId,
      actionType,
      actionSubtype,
      preCheckResult: preCheck?.result || 'UNKNOWN',
    },
  });

  // N93: Update case with recorded action milestone & advance active investigation stage
  const stageMap = {
    NOTICE: 'NOTICE_ISSUED',
    INSTRUCTION: 'INSTRUCTION_ISSUED',
    INSPECTION: 'INSPECTION_SCHEDULED',
    DOCUMENT_REQUEST: 'DOCUMENT_REQUESTED',
    OTHER: 'ACTION_RECORDED',
  };
  const newStatus = stageMap[actionType] || 'INVESTIGATION';

  if (!Array.isArray(caseDoc.statusHistory)) {
    caseDoc.statusHistory = [];
  }
  caseDoc.statusHistory.push({
    status: newStatus,
    at: now,
    by: user.displayName || user.username || user.role,
    office: user.bureau || (user.region ? \`Regional Office (\${user.region})\` : 'Assigned Cell'),
    role: user.role,
    action: actionType,
    subject: subject.trim(),
  });
  if (['ROUTED', 'REGISTERED', 'SUBMITTED'].includes(caseDoc.status)) {
    caseDoc.status = 'UNDER_INVESTIGATION';
  }
  await caseDoc.save();

  return {
    action: actionDoc,
    preCheck,
    canProceed: true,
  };`;

if (!content.includes('N93: Update case with recorded action milestone')) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(actionServicePath, content, 'utf8');
  console.log('Successfully patched actionService.js with N93 status update');
} else {
  console.log('actionService.js already patched');
}
