// Schema plugin registry for module-owned model extensions.
// A phase that needs extra fields on a model it does not own writes
// server/src/modules/<its module>/plugins/<model>.plugin.js, then appends
// one import line and one registry entry below. The owning model calls
// applyPlugins() before it is compiled.

const registry = [
  // { model: 'User', plugin: userIdentityPlugin },
];

export function applyPlugins(modelName, schema) {
  for (const entry of registry) {
    if (entry.model === modelName) schema.plugin(entry.plugin);
  }
}

import userIdentityPlugin from '../modules/identity/plugins/user.plugin.js';
registry.push({ model: 'User', plugin: userIdentityPlugin });

import caseLifecyclePlugin from '../modules/lifecycle/plugins/caseLifecycle.plugin.js';
registry.push({ model: 'Case', plugin: caseLifecyclePlugin });

import channelImportPlugin from '../modules/channels/plugins/case.plugin.js';
registry.push({ model: 'Case', plugin: channelImportPlugin });

import caseActionPlugin from '../modules/actions/plugins/caseAction.plugin.js';
registry.push({ model: 'case_actions', plugin: caseActionPlugin });
registry.push({ model: 'CaseAction', plugin: caseActionPlugin });

import userAbsencePlugin from '../modules/absence/plugins/userAbsence.plugin.js';
registry.push({ model: 'User', plugin: userAbsencePlugin });

import closureGatePlugin from '../modules/closure/plugins/case.plugin.js';
registry.push({ model: 'Case', plugin: closureGatePlugin });

import statusNoticePlugin from '../modules/notices/plugins/case.plugin.js';
registry.push({ model: 'Case', plugin: statusNoticePlugin });

import institutionLinkPlugin from '../modules/institutionview/plugins/user.plugin.js';
registry.push({ model: 'User', plugin: institutionLinkPlugin });

import authorityMemberPlugin from '../modules/authority/plugins/user.plugin.js';
registry.push({ model: 'User', plugin: authorityMemberPlugin });

import caseIndexesPlugin from '../modules/performance/plugins/case.plugin.js';
registry.push({ model: 'Case', plugin: caseIndexesPlugin });

import institutionPickerPlugin from '../modules/registry/plugins/institution.plugin.js';
registry.push({ model: 'Institution', plugin: institutionPickerPlugin });
import firstRedressalPlugin from '../modules/additions/n88-first-redressal/plugin.js';
registry.push({ model: 'Case', plugin: firstRedressalPlugin });
import institutionAddressPlugin from '../modules/additions/n109-institution-address/plugin.js';
registry.push({ model: 'Institution', plugin: institutionAddressPlugin });
