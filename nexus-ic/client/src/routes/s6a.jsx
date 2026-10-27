import React from 'react';
import Channels from '../pages/channels/Channels.jsx';
import EmailDraft from '../pages/channels/EmailDraft.jsx';
import EmailDrafts from '../pages/channels/EmailDrafts.jsx';
import AdminImport from '../pages/channels/AdminImport.jsx';
import Integrity from '../additions/n57-integrity/Integrity.jsx';
import Benchmark from '../pages/benchmark/Benchmark.jsx';
const complainants = ['student','faculty'];
export default [
  { path: '/channels', element: <Channels />, roles: complainants, public: false },
  { path: '/channels/email/:id', element: <EmailDraft />, roles: complainants, public: false },
  { path: '/my/email-drafts', element: <EmailDrafts />, roles: complainants, public: false },
  { path: '/my/email-drafts/:id', element: <EmailDraft />, roles: complainants, public: false },
  { path: '/admin/import', element: <AdminImport />, roles: ['system_admin'], public: false },
  { path: '/integrity', element: <Integrity />, public: false },
  { path: '/benchmark', element: <Benchmark />, roles: ['system_admin','supervisor'], public: false },
];
