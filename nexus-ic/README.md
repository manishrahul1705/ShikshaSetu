# ShikshaSetu
### *powered by NEXUS-IC*
> *Connecting Institutions. Coordinating Action. Resolving Grievances.*
> *"One Institution, One View, One Complaint Journey, Real Resolution"*  
> *"Verified People • Verified Institutions • Coordinated Bureaus • No Lost Transfers • Faster, Accountable Resolution"*

AICTE Smart India Hackathon solution for Problem Statement 26264: **Integrated Institution Grievance Monitoring and Resolution System**.

**Prototype disclosure (25 October 2026):** this prototype runs on sample data: fictional institutions, complaints and accounts. AICTE, ABC/APAAR, staff registry, SSO, CPGRAMS, email and SMS integrations remain simulators; no live government access, deployment approval, measured savings or certified compliance is claimed. Manish's explicit on-screen-label override moves this disclosure to the documents and presenter's spoken script. Real personal data must not be entered. The N55 export attribution watermark and invisible trace code remain; the data-disclosure footer was removed at Manish's request.

---

## Prerequisites

- **Node.js**: 20.19+ or 22.12+ (verified on 24.13.1; required by the approved Vite upgrade)
- **MongoDB**: Local MongoDB instance running on `localhost:27017` (or remote URI)
- **npm**: v9+ (npm workspaces enabled)

---

## Installation & Setup

1. **Clone & Install Dependencies**
   ```bash
   cd nexus-ic
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Set `SESSION_SECRET`, `VAULT_KEY` and `DOCS_KEY` to three independently generated values. Generate each value with:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```
   Keep the encryption keys stable across restarts; changing them makes previously encrypted records unreadable. Never commit `.env` or `.env.showcase`. Update the MongoDB URI if your local server differs.

3. **Reset and Seed Demo Database**
   ```bash
   npm run reset
   ```
   *Note: For safety, `npm run reset` will only drop databases whose name ends with `_demo`.*

4. **Start Development Servers (Server + Client)**
   ```bash
   npm run dev
   ```
   - Client web UI: [http://localhost:5173](http://localhost:5173)
   - Express server API: [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

All demo accounts use password: **`demo1234`**

| Username | Role | Bureau / Region | Synthetic | Description |
|---|---|---|---|---|
| `student1` | `student` | — | Yes | Demo Student complainant |
| `faculty1` | `faculty` | — | Yes | Demo Faculty complainant |
| `inst_admin1` | `institution_admin` | — | Yes | Demo Institution Nodal Officer |
| `rb_officer1` | `bureau_officer` | Regulation Bureau | Yes | Regulation Bureau officer |
| `pgrc_officer1` | `bureau_officer` | Public Grievance Redressal Cell | Yes | Public Grievance Redressal Cell officer |
| `regional1` | `regional_officer` | Northern | Yes | Northern Regional Office officer |
| `supervisor1` | `supervisor` | — | Yes | Bureau supervisor |
| `authority1` | `competent_authority` | — | Yes | AICTE Competent Authority |
| `auditor1` | `auditor` | — | Yes | Independent system auditor |
| `sysadmin1` | `system_admin` | — | Yes | AICTE IT system administrator |

---

## Running Tests & Traceability Checks

1. **Run Full Test Suite (Server + Client)**
   ```bash
   npm test
   ```
   This runs server tests and client tests with the Vitest JSON reporter, generating `test-results/server-results.json` and `test-results/client-results.json`, then automatically merges them into `test-results/results.json`.

2. **Run Traceability Checker**
   ```bash
   node scripts/trace-check.js
   ```
   To check stage S0 specifically:
   ```bash
   node scripts/trace-check.js --stage S0
   ```

3. **Generate Synthetic Test Data (N48)**
   ```bash
   npm run gen -- --count 5000 --seed 42
   ```

---

## Phase S0 Architecture & Security Controls

- **S01 (Zero Trust)**: Every API route is re-authorized server-side via `authorize` middleware.
- **S09 (Tamper-Evident Audit Log)**: SHA-256 cryptographic hash-chained `audit_events` with admin verification (`/api/v1/audit/verify`).
- **S16 (Session Security)**: `HttpOnly` `Secure` `SameSite=Lax` cookies; zero tokens stored in `localStorage` or `sessionStorage`.
- **S28 (Complainant Privacy)**: Safe logger refuses or redacts all complainant narrative, names, phones, emails, enrolments, and strings > 80 chars.
- **N48 (Test Data Generator)**: Reproducible generation of thousands of synthetic institutions, complainants, and grievances with Indian languages, acronyms, and typos.
- **N66 (Integrity Banner & Check)**: Persistent `SYNTHETIC DATA` banner on every page and export footer helper; admin-only audit chain verification button hidden in production mode.
