import React from 'react';
import { useI18n } from '../i18n/index.js';

/** Localized interface copy only. Source records and narratives stay unchanged. */
export default function PolishText({ children }) {
  const { t } = useI18n();
  if (typeof children !== 'string') return children;
  const key = `polish.${children.trim()}`;
  const value = t(key);
  return value === key ? children : value;
}
