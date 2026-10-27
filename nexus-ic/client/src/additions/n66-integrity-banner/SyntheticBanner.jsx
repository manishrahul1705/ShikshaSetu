import React from 'react';
import AuditChainCheck from './AuditChainCheck.jsx';

export default function SyntheticBanner({ user, appMode }) {
  return <AuditChainCheck userRole={user?.role} appMode={appMode} />;
}
