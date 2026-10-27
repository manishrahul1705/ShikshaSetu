# Final audit prompt (after S7, in a NEW conversation, strongest model)

Follow RULES.md. Do not write code. Only check and report.

1. Run `npm run reset`, `npm test` and `node scripts/trace-check.js`. Paste all outputs in full.
2. Walk through docs/SPEC.md from Section 1 to Section 18 and Appendix V. For every section, list each requirement sentence and point to the file and test that implements it, or write MISSING. Do the same for docs/ADDITIONS.md.
3. Run the judge script (docs/JUDGE_SCRIPT.md) step by step in the browser. Report each step as PASS or FAIL with what you saw.
4. Repeat the forbidden-pattern search from prompts/AUDIT.md over the whole repo.
5. Give me three lists: (a) MISSING or wrong, which must be fixed, (b) GAP or BLOCKED-SOURCE, which is accepted and listed in LIMITATIONS.md, (c) DONE.
