# Mobile delivery — N33 (PLANNED-P2)

AWAAZ DASTAK — powered by NEXUS-IC. SYNTHETIC DATA.

The P1 mobile answer is the installable PWA using the same React portal, server API, HttpOnly session and identity verification as the web portal. Native Android and iOS applications are P2 and are **not built**.

The manifest is `client/public/manifest.webmanifest`; the handwritten worker is `client/public/sw.js`. Only built JavaScript/CSS, icons and the fixed offline notice are eligible for its cache. API traffic and navigations use the network; failed navigation shows the plain offline notice. Case data, documents, identity, tokens and mutations are never stored or queued offline. Logout clears this worker's caches. N49 offline sync was NOT-ADOPTED.

Install through a supporting browser on HTTPS or localhost. Standalone display mode is sent as channel metadata to the existing web submission API: PWA when the client explicitly reports standalone, WEB otherwise. It does not change authorization, verification or routing decisions. Native apps and real integration remain contract-gated P2 work.
