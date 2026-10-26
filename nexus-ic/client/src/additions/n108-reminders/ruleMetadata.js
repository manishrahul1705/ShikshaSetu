import { policyText } from '../../components/RuleVersion.jsx';
// Controlled RuleBook description metadata only; never complaint/evidence text.
export const policyDescription = value => policyText(value).replace(/\b(?:synthetic|demo)\b\s*:?\s*/gi, '').trim();
