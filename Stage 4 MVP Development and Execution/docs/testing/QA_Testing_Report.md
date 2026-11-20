# MAMAR — QA & Testing Report

**Version:** Draft 0.5  
**Test Date:** November 19, 2026  
**Environment:** Deployed Application & Isolated Local Test Database

## 1. Testing Summary

MAMAR underwent automated unit and integration testing, followed by two manual end-to-end scenarios covering the Contractor, Service Provider, and Field Worker workflows.

| Test Area | Results | Status |
|---|---|---|
| Frontend Unit & Component Testing | 807/807 passed (63 files) | PASS |
| Backend Unit Testing | 15/15 passed | PASS |
| Backend Integration Testing | 232/232 passed | PASS |
| **Total Automated Tests** | **1,054/1,054 passed** | **PASS** |
| UAT — Testing Project #73 | Project creation through worker assignment; on-site execution not completed | PARTIAL |
| UAT — Exit_31 #79 | Project lifecycle completed with one confirmed functional issue | COMPLETED WITH DEFECT |

## 2. Automated Testing

### Frontend Testing

**Execution Command:**

```bash
npm run test:coverage
```

**Results:** 807 tests passed across 63 test files.

| Statements | Branches | Functions | Lines |
|---|---|---|---|
| 91.37% | 88.13% | 92.11% | 92.05% |

### Backend Unit & Integration Testing

**Execution Command:**

Run from the `backend/` directory using an isolated local PostgreSQL test database.

```bash
DATABASE_URL="postgresql://codespace@127.0.0.1:5433/mamar_test" \
python -m pytest tests/ --cov=app --cov-report=term-missing --cov-report=html --tb=short -q
```

**Results:**
- Unit Tests: 15 passed
- Integration Tests: 232 passed
- Backend Statement Coverage: 92%
- Total Statements: 3,078
- Missed Statements: 241

All backend tests were executed against a dedicated local test database, isolated from the deployed environment.

## 3. Manual User Acceptance Testing (UAT)

### Scenario A — Testing Project #73

**Participants:** Contractor Razan, Shawahid Roads Industrial Co. (Service Provider), Field Worker #38.

**Request:** REQ-69  
**Quotation:** #44 — SAR 6,000

| Test Case | Result |
|---|---|
| Project creation and GIS work-zone configuration | PASS |
| Work-zone polygon editing and persistence | PASS |
| Service request visibility and quotation submission | PASS |
| Contractor quotation acceptance | PASS |
| PayPal Sandbox payment (USD 1,600) | PASS |
| Notifications and project monitoring | PASS |
| Field worker assignment and project visibility | PASS |
| GPS verification restriction outside the 50 m radius | PASS |
| On-site check-in, photo upload, and project closure | NOT TESTED |

**GPS Verification:** The worker was approximately 8.2 km from the project location. The system correctly prevented verification outside the permitted 50 m radius.

**Payment Reference:** `1YA38794R4735640T`

### Scenario B — Exit_31, Project #79

**Participants:** Contractor Razan, Safety Arabia Provider, Field Worker Ahmed.

**Project Dates:** November 21–29, 2026  
**Work Zone Area:** 8,628.79 m²  
**Services:** Temporary Traffic Control, Road Signs & VMS

| Test Case | Result |
|---|---|
| Project creation and work-zone configuration | PASS |
| Project assignment and worker dashboard visibility | PASS |
| GPS verification within the permitted 50 m radius | PASS |
| Field execution status updated to Completed | PASS |
| Site photo selection and preview | PASS |
| Site photo upload and visibility | FAIL |
| Provider completion submission | PASS |
| Contractor completion review and approval | PASS |
| Final project status displayed as Completed | PASS |

**GPS Verification:** Device `TC-014` was successfully verified at approximately 45 m from the planned location, within the permitted 50 m radius.

**Outcome:** The project successfully progressed through the complete workflow and reached the final **Completed** status. However, site photos were not displayed in the monitoring and completion review sections.

## 4. Defects & Follow-up

| Issue | Description | Status |
|---|---|---|
| **BUG-PHOTO-79** | Selected site photos were not displayed in Provider Site Updates, Contractor Monitoring, or Final Evidence. | OPEN — Assigned to Shouq |
| **OBS-PROVIDER-79** | Completion Review displayed "Service Provider: Not assigned" despite provider participation. | Under Investigation |

The root cause of the photo issue has not yet been confirmed.

## 5. Evidence & Remaining Tests

### Test Evidence

Screenshots were captured during both UAT scenarios to document project creation, GIS work zones, quotations, payments, field execution, GPS verification, and project completion.

Evidence will be organized under:

`docs/testing/evidence/`

### Remaining Tests

Before final QA approval:

- Fix and retest the site photo upload issue.
- Verify the correct Service Provider information in Completion Review.
- Validate the complete photo upload and retrieval workflow.
- Execute final regression testing after fixes.
- Rerun automated test suites and confirm no regressions.
- Attach supporting screenshots and test evidence to the repository.

## 6. Conclusion

MAMAR successfully passed **all 1,054 executed automated tests**, achieving **91.37% frontend statement coverage** and **92% backend statement coverage**.

Manual UAT confirmed the main workflows across all three user roles, including project creation, quotation management, sandbox payment, GIS location verification, field execution, and final project completion.

One functional defect related to site photo uploads remains open, while the Service Provider display issue requires further investigation.

**Overall QA Status: PASSED WITH OPEN ISSUES — Final Regression Pending.**
