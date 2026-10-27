// One appended import in main.jsx; manifest linked explicitly by index.html.
export function installPwa(documentRef = document, navigatorRef = navigator) {
  if ('serviceWorker' in navigatorRef) return navigatorRef.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => null);
  return Promise.resolve(null);
}
export { isStandalone } from './display.js';
if (typeof document !== 'undefined' && import.meta.env.MODE !== 'test') void installPwa();
