# Generated student verification dataset

`student-verification.csv` contains 1,515 generated student identities for the local application. Every identity has an ABC/APAAR test reference, an Aadhaar-format test number, institution PID, programme, linked test email, linked non-dialable phone and enrolment status. The leading-1 Aadhaar-format values must never be described as issued Aadhaar IDs. All email addresses use `example.invalid`; phones use a non-dialable `+91 00000` prefix. No real personal records are included.

CSV references are test inputs only. The separate `awaaz_dastak_identity_simulator` database stores keyed hashes of ABC/APAAR and Aadhaar references, plus test contacts; full identifiers are not persisted there. The local CSV intentionally contains the generated input values for checking.

Test account: `student1` / `demo1234` (unverified before this change). Start with ABC/APAAR `1000-2000-3001` or its Aadhaar-format alias `100000000015`. These identify the same student. A student can bind to only one account.

Open http://localhost:5180/verify after signing in. Fetch linked details, confirm they belong to you, choose email/SMS, send the code, open the local inbox on the same page, and enter the code to complete. Do not enter a real Aadhaar number, phone or email. The destination is selected from the linked record; callers cannot replace it.

Codes are generated randomly, expire after the configured five minutes, allow five attempts, are single-use and are bound to the signed-in account. Resends require a 30-second wait. Inactive, unresolved, mismatched or already claimed records stay unverified with a same-page explanation. No automatic officer forwarding occurs in this flow.

Actual email/SMS delivery and government identity-provider access are not connected. The local inbox is explicitly a delivery preview, not evidence that a real message reached a mailbox or handset.

Regenerate/additively update the dataset and separate registry using `node scripts/seed-identity-simulator.cjs`. Restart the showcase API afterward to load the updated registry into its local simulator cache. Never reset the shared dataset merely to repeat a verification; use another eligible generated identity and unverified test account.
