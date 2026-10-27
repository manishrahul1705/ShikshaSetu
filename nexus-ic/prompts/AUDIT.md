# Audit prompt (run at the end of every stage, in a NEW conversation)

Follow RULES.md. Do not write any code in this conversation. Only check and report.

1. Run `node scripts/trace-check.js` and paste the full output.
2. Run `npm test` and paste the summary (passed, failed, skipped). Any skipped test is a failure.
3. Open FEATURES.md. List every ID that is not DONE, grouped by status, with the reason in one line each.
4. For every row marked DONE in the stage I name below, open the files in "Built in" and the test in "Proved by". Compare them with the SPEC.md section the row points to, sentence by sentence. Report any sentence of SPEC.md that the code does not implement, and any place where the code changed a name, text, rule, status or number from SPEC.md.
5. Search the code for things the rules forbid and report each hit with file and line:
   - TypeScript files, or any "digital twin"
   - tokens in localStorage
   - complainant text or identity fields passed to a logger, notification or export
   - any automatic closure, automatic rejection or automatic ownership change
   - any institution "score", "risk score" or "compliance score"
   - a missing feed rendered as 0
   - `.skip`, `.only` or commented-out tests
   - hard-coded SLA days or thresholds outside the RuleBook seed
6. List anything that is in SPEC.md or ADDITIONS.md but has no row in FEATURES.md (should be none).
7. End with: "Safe to commit: YES / NO" and why.

Stage to audit: <write S0, S1, ... here>
























first go to th eprompts folder check whethre all the things are implemeneted as in the files and completely make th efeatures added and then no fetures should be missing and also review each oages in all th elogins  no pages should be like each other everything should be neat and perfectly aligned and that every page should like complete and ther eshould be no unwanted gaps in the pages everything ahould work properly and in the institute registereation page if i eneter th ecollege name it should automatically fetch the details of the pid and icid and on emore gthing the project should be routed with the indian institute of council and that busing the institute of icic it need tro fetch the region of the college an dthen then the complaint should be forwarded to th eregional grienvemnces cell and it needs to be prosessed and ststrus should be updated as soon as possible and also show soem indian map and mark the spot of the region of the institute then also the status of teh complaint should be uploadee drealistic if forward the n only forwarded nd then completedd or action taken means taht status is to be given and then abcid and apaar id verification should be given. and also chweck and rate how well the asolution is aligne dwith the problem statement and also add some safron color to all pages if i search for an institute it should fetch from the iic portal using the icid it should return all the details whatever the colleg that has been registered under aicte