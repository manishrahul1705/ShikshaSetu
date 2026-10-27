export function validateProceedReason(reason) {
  if (typeof reason !== 'string' || !reason.trim()) {
    const error = new Error('PROCEED_REASON_REQUIRED');
    error.status = 400;
    error.code = 'PROCEED_REASON_REQUIRED';
    throw error;
  }
  return reason.trim();
}

export function actionSummary(action, linkedCase) {
  return {
    bureau: action.bureau,
    actionType: action.actionType,
    at: action.at,
    caseId: linkedCase.masterCaseId,
  };
}
