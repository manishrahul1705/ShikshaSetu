# Browser rehearsal evidence

## Final polish — 26 October 2026

The current showcase sequence passed **3/3, zero failed, skipped, flaky or retried**, in 477.8 seconds. See `browser-results.json` and `final-polish/evidence-summary.json`. Each run has **25 numbered step screenshots** and a completed video, against **awaaz_dastak_showcase** on loopback ports 4317/5317. No reset or seeding occurs in the runner. The shared `awaaz_dastak_demo` remains untouched.

| Run | Completed (IST, 26 October) | Case | Manifest |
|---|---|---|---|
| 1 | 10:53:44 | NX-2026-000008 | run-1/evidence.json |
| 2 | 10:56:24 | NX-2026-000009 | run-2/evidence.json |
| 3 | 10:59:03 | NX-2026-000010 | run-3/evidence.json |

The new sequence covers the institution picker and retained typed-PID fetch, Hindi intake, PREVENT preview/edit/confirmation, actual submission snapshots, case explanation, Institution 360 and rendered React Flow graph, officer review, transfer acceptance, evidence-gated human closure, own-case tracking, downloaded QR receipt, feedback, authority, IMPACT drill-down, live Present results, audit chain and integrity. Banned on-screen data labels are checked at every numbered capture. Policy IDs stay unchanged in records and appear as friendly versions; the audit tooltip retains the full ID.

Use the exact video path in each completed manifest; earlier debugging videos remain in these folders. Run 1's legacy `screenshots` folder count includes an older QA frame; the current summary explicitly enumerates the 25 numbered flow captures per run. Extra `video-*.png` files are inspection frames, not flow steps. The screenshots are the primary still evidence: full-page capture temporarily changes the recorded viewport and some video frames become small or blank during navigation/capture. Ordinary interaction frames at 50 seconds (run 1) and 20 seconds (runs 2 and 3) were extracted and visually inspected; their fields/narrative are hidden. This is sampled video QA, not a claim that every frame was manually reviewed.

The four requested views in `final-polish/` are `landing.png`, `command-centre.png`, `case.png` and `picker.png`; `case-explanation.png` provides the expanded panel. All four were visually inspected. The picker shows public institution metadata unmasked, with no complaint text. Explicit prototype/sample-data disclosure remains here and in README, LIMITATIONS and the spoken judge script. All records are fictional; these are not real pilot results.

Playwright 1.64.1 uses existing **Chrome 155.0.8059.85**, with a fresh profile. Downloaded Chromium 156 could not launch on this laptop. Privacy masking is installed before page creation; automatic raw failure screenshots and traces are disabled. Transient React Flow size warnings occurred at mount, but the saved Institution 360 captures show the actual graph. No load-time or accessibility certification is implied.

## Historical JURY-91 run — 25 October 2026

JURY-91, 25 October 2026. All records are synthetic. This folder contains release evidence, not real complainant or pilot data.

The rehearsal uses Playwright 1.64.1 and the existing Chrome 155.0.8059.85 with a fresh temporary browser profile. The approved downloaded Chromium 156.0.8078.4 failed Windows side-by-side activation; its successful download is not a successful browser launch. No existing user profile is accessed.

The application runs on loopback ports 4317 (API) and 5317 (client), against **awaaz_dastak_e2e_demo**. Initial login accounts are bootstrapped only in that dedicated database. Each rehearsal signs in as supervisor1 and calls the existing authenticated Judge Mode reset. The shared awaaz_dastak_demo database has not been reset. All accounts use synthetic credentials from the existing seeds.

## Runs

The historical isolated sequence completed: **3 passed, 0 failed, 0 skipped, 0 flaky**, no retries; 12.9 minutes total, 22 screenshots per run. Completed UTC times were run-1 13:41:44, run-2 13:45:31 and run-3 13:48:55 on 25 October 2026. The current manifests and numbered screenshots now refer to the final-polish showcase sequence above; older videos can remain in the video folders. This historical sequence is not the final-polish proof.

Run folders contain full-page PNGs, a video subfolder and evidence.json only after the entire flow succeeds. Root-level NN-step-name.png files are the latest captured screen for stage backup; during debugging these can be partial and are not proof that the entire flow passed. The run manifest identifies the completed run and its actual browser version. Earlier debugging videos can also exist in run-1/video; use the exact video path in a completed final manifest.

## Story covered

Landing; student verification with explicit consent and local OTP; reporter pseudonym; PID lookup; Hindi; photo EXIF scrubbing; PREVENT Stage 1; preview/edit/explicit confirmation; Institution 360 and routing/priority explanation; both overlap-timeline lanes and REVIEW conflict; officer action check/proceed; requested transfer with sender accountable; receiving bureau acceptance; closure blocked; evidence-backed proposal; different-person approval and human closure; complainant tracking; downloaded QR receipt; feedback; authority; IMPACT and exact-case drill-down; audit chain check; integrity fingerprint.

The actual Judge Mode/identity simulator PID is **1-1000000001**. The illustrative PID 1-1234567890 in the older judge script is not substituted into the registry or fabricated. Missing ICID is shown as unavailable, not invented.

## Privacy

The browser context installs a privacy guard before page creation. Input/textarea values are hidden in video; the public institution PID is explicitly exempted. Narrative, OTP, email and synthetic personal-name text are hidden before paint and excluded from accessibility failure snapshots. Full-page screenshots also apply opaque masks. Automatic raw screenshots and traces are disabled. Raw complaint text is kept out of assertion output. The QR receipt contains no narrative and uses the server's existing role/office watermark.

Inspect screenshots and sampled video frames before presenting them. A saved image or a successful API test alone is not a completed browser rehearsal. No shared-demo readiness claim is made until Manish separately approves its reset and a stage-laptop rehearsal succeeds.
