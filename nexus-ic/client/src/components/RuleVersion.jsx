import React from 'react';

export function ruleLabel(value, family = 'Rule') {
  if (!value || value === 'POLICY_NOT_CONFIGURED') return 'Not available: no approved policy';
  if (value === 'DEMO-CASE-STANDARD-v1') return 'Standard case policy v1 (14 days)';
  const version = String(value).match(/(?:^|-)(v\d[\w.-]*)$/i)?.[1];
  return version ? `${family} ${version}` : `${family} version recorded`;
}
// Only for policy metadata/reasons. Never transform complaint narratives or source IDs.
export function policyText(value) {
  return String(value || '').replace(/DEMO-[A-Z0-9_-]+-v[\w.-]+/g, id => ruleLabel(id));
}
export default function RuleVersion({ value, family, audit = false }) {
  return <span title={audit ? String(value || '') : undefined}>{ruleLabel(value, family)}</span>;
}
