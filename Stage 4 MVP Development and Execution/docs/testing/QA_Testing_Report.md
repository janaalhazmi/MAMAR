<!-- Repository destination: docs/testing/QA_Testing_Report.md -->
<!-- Working version v0.3; do not mark as final until defect retesting and source code evidence are added. -->

# MAMAR

## Comprehensive QA & Testing Report

Draft v0.3  |  Test execution date: 19 November 2026  |  Scope: Automated tests + two manual UAT scenarios

Prepared as an evidence-based working report. Successful automated execution does not certify full system security or release readiness. Source-code excerpts have not been fabricated; attach exact test files before final submission.

## 1. Executive Summary

| Workstream | Executed result | Assessment |
| --- | --- | --- |
| Frontend automated | 807 / 807 passed; 63 test files | PASS for executed suite |
| Backend unit | 15 / 15 passed | PASS for executed suite |
| Backend integration | 232 / 232 passed | PASS for executed suite |
| Total automated | 1,054 / 1,054 passed | PASS for executed suite |
| UAT #73 — Testing Project | Contractor → quote → sandbox payment → provider → field worker; blocked by off-site GPS | PARTIAL |
| UAT #79 — Exit_31 | Creation → provider → worker → location verification → completion → contractor closure | COMPLETED WITH DEFECT |
| Open issue | Site photos not visible to provider or contractor; assigned to Shouq for investigation | OPEN |

## 2. System Under Test & Environments

Application: MAMAR, B2B temporary traffic-control coordination platform. Roles: Contractor, Service Provider, Field Worker. Frontend: React, deployed to Vercel; backend: FastAPI, SQLAlchemy, Pydantic; database: PostgreSQL; GIS: Esri map / work-zone polygon. Payment tested using PayPal Sandbox only (no real funds).

Automated backend tests used a separate local PostgreSQL database on port 5433; live Supabase data was not intended to be used for test execution. The deployed UAT environment is distinct from the isolated automated test database.

## 3. Automated Testing — Commands and Results

### 3.1 Frontend Unit / Component Tests

Recorded command: npm run test:coverage

| Metric | Result |
| --- | --- |
| Tests | 807 passed / 807 |
| Test files | 63 |
| Statements | 91.37% |
| Branches | 88.13% |
| Functions | 92.11% |
| Lines | 92.05% |

Interpretation: the recorded frontend suite passed at its last run. Exact test file names, assertions, and per-file coverage should be inserted from the source repository or test output, not inferred from aggregate numbers.

### 3.2 Backend Unit & Integration Tests

Recorded command (run from backend/):

```bash
DATABASE_URL="postgresql://codespace@127.0.0.1:5433/mamar_test" \
python -m pytest tests/ --cov=app --cov-report=term-missing --cov-report=html --tb=short -q
```

| Metric | Result |
| --- | --- |
| Backend unit tests | 15 passed |
| Backend integration tests | 232 passed |
| Backend total | 247 passed |
| Overall backend statement coverage | 92% |
| Coverage statements / missed | 3,078 / 241 |
| Coverage HTML output | htmlcov/ (local artifact) |

Database isolation control: override DATABASE_URL explicitly for tests to avoid accidental execution against a live .env configuration. The isolated PostgreSQL 18 cluster was configured on port 5433. The command is documented for reproducibility; database credentials are local test configuration, not production secrets.

### 3.3 Source Code and Reproducibility Register

| Artifact | Status / required action |
| --- | --- |
| Frontend test source | Exact test files and assertions not supplied with this report; append verified repository excerpts. |
| Backend test source | Exact pytest functions not supplied; append verified repository excerpts. |
| Frontend coverage report | Attach generated coverage artifact or terminal output if available. |
| Backend coverage report | Attach terminal output and htmlcov index if available. |
| Existing project documentation | Review docs/testing/QA_Testing_Report.md and QA_TEST_CASES_SPRINT1.md before consolidation. |

## 4. Manual UAT — Scenario A: Testing Project #73

Roles: Contractor Razan; provider Shawahid Roads Industrial Co.; worker Shawahid Field Worker (ID 38). Planned location 24.726813, 46.663494. Project dates 20–30 Nov 2026. Request REQ-69; quote #44 for SAR 6,000.

| ID | Action / observed result | Status |
| --- | --- | --- |
| A01 | Contractor created project and drew work-zone polygon; polygon persisted after reopen. | PASS |
| A02 | Provider received request and viewed location / requested services. | PASS |
| A03 | Provider submitted itemized SAR 6,000 quote. | PASS |
| A04 | Contractor received quotation notification, accepted quote. | PASS |
| A05 | PayPal Sandbox payment completed; reference 1YA38794R4735640T; USD 1,600 shown at 3.75 SAR/USD. | PASS |
| A06 | Contractor monitoring displayed polygon, 0% progress, site Not Started, weather / traffic and AI summary. | PASS |
| A07 | Provider received acceptance notification and assigned worker ID 38. | PASS |
| A08 | Worker dashboard showed assigned project; work zone visible. | PASS |
| A09 | GPS captured 24.794638, 46.631827, accuracy ±179m; distance 8.2km vs 50m allowed; save disabled. | PASS — negative path |
| A10 | Worker changed execution status to Work in Progress despite no site check-in shown. | OBSERVED / RULE REVIEW |
| A11 | Check-in off-site restriction reported by tester; exact server-side enforcement not verified. | PARTIAL |
| A12 | On-site photo upload and successful field check-in not performed in scenario A. | NOT TESTED |

Quotation detail: barriers 20 × SAR150 = 3,000; cones 10 × SAR80 = 800; signs 5 × SAR200 = 1,000; delivery/install/removal SAR1,200; total SAR6,000. Payment used sandbox; never report it as real monetary settlement.

## 5. Manual UAT — Scenario B: Exit_31 #79

Contractor: Razan; Service Provider: Safety Arabia Provider; Field Worker: Ahmed. Project type: Road Maintenance; dates 21–29 Nov 2026; description: Traffic Management. Planned point approximately 24.59855, 46.589929. Work zone area: 8,628.79 m². Requested services: Temporary Traffic Control and Road Signs & VMS.

| ID | Action / evidence | Assessment |
| --- | --- | --- |
| B01 | Review screen displayed project details and mapped polygon with area 8,628.79 m². | PASS — UI observed |
| B02 | Worker Ahmed dashboard displayed one assigned upcoming Exit_31 project. | PASS |
| B03 | Device TC-014 verification showed captured 24.598166, 46.589800; 45m from planned point (50m threshold), ±143m accuracy; Verified and saved. | PASS — UI / reported save |
| B04 | Worker marked execution Completed; polygon and worker listed. | PASS |
| B05 | Photo preview appeared, category After, Send Photos (1) enabled. | PASS — selection only |
| B06 | Provider project #79 showed progress 100%, site Completed, assigned worker, but Site Updates: No site photos yet. | PASS for status; FAIL for photo visibility |
| B07 | Provider Completion Review displayed Send to Contractor / Return to Field Team; final submission progressed to contractor. | PASS — workflow observed |
| B08 | Contractor monitoring displayed Completed and all milestones, but no latest site updates / photos. | PASS for status; FAIL for photo visibility |
| B09 | Contractor Review Completion displayed Awaiting Your Approval, progress 100%, service milestones complete. | PASS |
| B10 | Final Evidence section had no visible photo; provider field showed Not assigned. | DEFECT / INVESTIGATE |
| B11 | Contractor completed approval; My Projects listed Exit_31 as Completed. | PASS |

### 5.1 GPS Quality Caveat

Although 45m was inside the 50m configured threshold, browser-reported GPS uncertainty was ±143m. The app accepted the measurement. This is a precision / trustworthiness risk to assess against business requirements; not proof of a faulty distance formula.

### 5.2 Workflow Consistency Caveat

Worker page showed Today’s Check-in: Not yet and provider page showed Last check-in: — even while status became Completed. Confirm whether check-in is mandatory before status changes and completion; treat as requirement review until confirmed.

## 6. Defect Register & Team Follow-up

| ID | Issue | Priority | Owner | Status |
| --- | --- | --- | --- | --- |
| BUG-PHOTO-79 | Selected photo not visible in Provider Site Updates, Contractor Monitoring or Final Evidence. Root cause unknown: upload, persistence, retrieval, or rendering. | High | Shouq (backend triage) | OPEN |
| OBS-PROVIDER-79 | Contractor Review Completion displays Service Provider: Not assigned despite Safety Arabia Provider workflow. | Triage | Unassigned | NEEDS VERIFICATION |
| OBS-CHECKIN-79 | Completed execution with no recorded check-in visible. Confirm business rule. | Triage | Unassigned | REQUIREMENT REVIEW |
| OBS-GPS-79 | GPS accuracy ±143m while acceptance threshold 50m. | Triage | Unassigned | RISK REVIEW |
| KNOWN-77 | Prior quotation submission navigation / redirect issue, pending regression confirmation. | Triage | Unassigned | RETEST |

### 6.1 Photo Issue — Reproduction Summary

Steps: Log in as field worker Ahmed → open Exit_31 → Site Updates → select image → choose After → use Send Photos (1) → inspect provider project #79 and contractor monitoring / completion. Expected: saved photo appears consistently and persists after refresh. Actual observed: selected preview exists, downstream pages show no photos. Screenshots do not prove the HTTP request outcome; inspect browser Network tab and backend logs before assigning root cause.

Team routing: the user reported assigning the issue to Shouq for backend investigation. Exact GitHub issue number / URL not supplied; add once available.

## 7. UAT Evidence & Screenshot Traceability

Scenario A: earlier evidence ZIP MAMAR_UAT_Evidence_2026-11-19.zip contains 30 screenshots plus evidence-index.csv; retain ZIP until repository upload. Scenario B: ten screenshots received in this conversation (19 Nov 2026, around 19:00 local). These are visual evidence, not automated logs.

| Evidence | What it establishes |
| --- | --- |
| B-01 | Review screen, project details, polygon and area |
| B-02 | Ahmed worker dashboard assignment |
| B-03 | TC-014 GPS verification at 45m |
| B-04 | Completed execution and photo selected |
| B-05 | Provider progress 100%, status Completed |
| B-06 | Provider Completion Review and No site photos yet |
| B-07 | Contractor monitoring Completed, no updates/photos |
| B-08 | Contractor completion review, provider Not assigned |
| B-09 | Final Evidence blank and approval controls |
| B-10 | My Projects Exit_31 Completed |

## 8. Remaining Tests / Exit Criteria

| Area | Outstanding verification |
| --- | --- |
| Photo workflow | Repeat upload while capturing HTTP request, response, storage record, refresh persistence, provider and contractor visibility. |
| Check-in | Confirm successful on-site check-in and whether it is a prerequisite to completion. |
| Role security | API-level authorization for contractor, provider, worker; cross-project access denied. |
| Negative flows | Duplicate quote, rejected quote, cancelled payment, invalid forms, project cancellation and request changes. |
| Regression | Re-run 1,054 automated tests after fixes; re-test known quote redirect issue. |
| Evidence integrity | Archive originals and index, link each test case to original screenshot and GitHub issue. |

## 9. Overall Conclusion

The recorded automated suites passed (1,054/1,054). The second deployed UAT scenario reached a Completed project state and demonstrated on-site device verification. A high-priority photographic evidence defect remains open; contractor completion UI also displayed an apparently missing provider association. The test record supports successful execution of the demonstrated workflow, not unrestricted production readiness. Final sign-off requires defect retest, remaining negative/security checks, and source/log evidence attachment.

## Appendix A — Key Visual Evidence (Scenario B)

![UAT-007 evidence 1](evidence/uat/UAT-007-project-completion/UAT-007-evidence-01.png)

*Exit_31 field worker assignment*

![UAT-007 evidence 2](evidence/uat/UAT-007-project-completion/UAT-007-evidence-02.png)

*Device verification: 45 m, Verified*

![UAT-007 evidence 3](evidence/uat/UAT-007-project-completion/UAT-007-evidence-03.png)

*Execution Completed and selected photo*

![UAT-007 evidence 4](evidence/uat/UAT-007-project-completion/UAT-007-evidence-04.png)

*Provider completion review and absent photos*

![UAT-007 evidence 5](evidence/uat/UAT-007-project-completion/UAT-007-evidence-05.png)

*Contractor monitoring and absent updates*

![UAT-007 evidence 6](evidence/uat/UAT-007-project-completion/UAT-007-evidence-06.png)

*Contractor completion review*

![UAT-007 evidence 7](evidence/uat/UAT-007-project-completion/UAT-007-evidence-07.png)

*Final Evidence section and approval controls*

![UAT-007 evidence 8](evidence/uat/UAT-007-project-completion/UAT-007-evidence-08.png)

*Final My Projects Completed status*

End of working report — update after Shouq’s fix and final regression run.


## Appendix B — Evidence and source-code follow-up

- **Scenario A screenshot archive:** `MAMAR_UAT_Evidence_2026-11-19.zip` (30 screenshots, with `evidence-index.csv`). This archive is not duplicated here; extract it into `docs/testing/evidence/uat/` before adding individual image links.
- **Scenario B evidence:** eight embedded screenshots extracted from the Word report and linked above. Keep the original screenshots if higher-quality versions are available.
- **Actual test source code:** Not included in the available Word report. Do not substitute invented tests. Add verified excerpts from frontend and backend test files, and coverage outputs, before final submission.
- **GitHub issue:** Photo upload/display defect assigned to Shouq; add issue number once known.
