# Jury demo guide (showcase)

## Start it

1. `npm run showcase:seed` rebuilds the separate `awaaz_dastak_showcase` database with 120 fictional institutions and 600 generated cases, plus workflow fixtures. The current prepared database has 623 cases, source-defined policy clocks, appeals, identity requests, detector alerts and a benchmark run. It refuses any database whose name does not end in `_showcase`; never reset the shared `awaaz_dastak_demo` without Manish's approval. No rebuild is needed to present the prepared data.
2. `npm run dev:showcase` serves the app at **http://localhost:5180** (API on 3100, no auto-restart). It runs beside the normal dev server on 5173.

Both servers share `localhost` cookies, so use one of them per browser profile.

## The 5-minute path

1. Landing page: hero, the six-checkpoint journey, the NEXUS modules.
2. Sign in as **supervisor1** (password `demo1234`), open **Guided Walkthrough** in the sidebar, and start the guided tour. Each "Next step" switches to the appropriate local account and opens the next page. The scenario institution is PID **1-7734299133**, ICID **IIC-228M6C2D**; earlier sequential PIDs are historical fixtures only.
3. Points to call out on the way:
   - **Command centre**: scoped KPI cards and charts; unavailable measures retain their reasons and are never shown as zero. The RuleBook names the reference clock **Standard case policy v1 (14 days)**, with near-due at 72 hours; these are source-defined prototype settings, not official AICTE legal timelines.
   - **Case page** (`/cases/<Master Case ID>`): PID, ICID with the identity check (matches / not available / identity review), the source trail (intake channel and external references), routing rule and reasons, ownership path and the dated timeline beside the audit-chain entries.
   - **Global search** (top bar): type a Master Case ID, a PID, or an ICID such as `IIC-228M6C2D`; the ICID resolves to its PID first.
   - **Switch role** (top bar): change the local presentation account in one click; hidden in production mode.

## Demo accounts

`trust_student_verified` (student with cases), `rb_officer1`, `pgrc_officer1`, `regional1`, `supervisor1`, `authority1`, `auditor1`, `sysadmin1`, `inst_admin1`. All use `demo1234`. `student1` is unverified on purpose (it shows the verification gate).

The product runs on synthetic sample data and local adapters. No real college has an invented grievance attached to it. The integrity calendar reconstructs completed UTC days through the real capture service; empty days have no root hash. It does not demonstrate thirty days of historical scheduler execution. See the Global Jury audit index and report for current screenshots, checks and limitations.
