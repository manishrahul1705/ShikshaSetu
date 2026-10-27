export function isStandalone(windowRef = window, navigatorRef = navigator) {
  return windowRef.matchMedia?.('(display-mode: standalone)').matches === true || navigatorRef.standalone === true;
}
