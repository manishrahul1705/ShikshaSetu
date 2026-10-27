// Runs before page creation/navigation; observers execute before rendering a frame.
function installPrivacyGuard() {
  const css = 'input:not([data-jury-public]),textarea{color:transparent!important;caret-color:transparent!important;text-shadow:none!important} [data-jury-private]{visibility:hidden!important}';
  const privateText = /Synthetic judge scenario:|Judge scenario:|JURY91_PRIVATE|Synthetic trust account|Synthetic (student|faculty)|Demo (Student|Faculty|Supervisor|.*Officer)|[\w.+-]+@[\w.-]+\.[a-z]{2,}|^\s*\d{6}\s*$/i;
  function protect(root = document) {
    if (!document.documentElement) return;
    if (!document.querySelector('#jury-privacy')) {
      const style = document.createElement('style'); style.id = 'jury-privacy'; style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
    function text(node) {
      const parent = node.parentElement;
      if (parent && !['SCRIPT','STYLE'].includes(parent.tagName) && privateText.test(node.nodeValue || '') && !parent.hasAttribute('data-jury-private')) { parent.setAttribute('data-jury-private', ''); parent.setAttribute('aria-hidden', 'true'); }
    }
    if(root.nodeType===Node.TEXT_NODE) { text(root); root=root.parentElement; }
    if(!root)return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while(walker.nextNode())text(walker.currentNode);
    const matching = selector => [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) || [])];
    for (const node of matching('.whitespace-pre-wrap')) if (!node.hasAttribute('data-jury-private')) { node.setAttribute('data-jury-private', ''); node.setAttribute('aria-hidden', 'true'); }
    for (const node of matching('input:not([type="checkbox"]):not([data-jury-public]),textarea')) if (node.getAttribute('aria-hidden') !== 'true') node.setAttribute('aria-hidden', 'true');
  }
  new MutationObserver(records => {
    const roots=new Set();
    for(const record of records) {
      if(record.type==='characterData')roots.add(record.target);
      else for(const node of record.addedNodes)roots.add(node);
    }
    for(const root of roots)protect(root);
  }).observe(document, { childList: true, subtree: true, characterData: true });
  protect();
}
module.exports = { installPrivacyGuard, privateNarrative: ['Judge scenario:', 'laboratory fee refund not paid after request'].join(' ') };
