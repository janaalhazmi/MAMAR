# MAMAR — QA & Testing Report

**Version:** Draft 0.4 · **Test date:** 19 November 2026 · **Environment:** Deployed application + isolated local test database

## 1. Testing Summary

MAMAR was tested through automated frontend/backend suites and two manual end-to-end scenarios covering Contractor, Service Provider, and Field Worker workflows.

| Test area | Result | Status |
| --- | --- | --- |
| Frontend unit/component | **807/807** tests passed (63 files) | PASS |
| Backend unit | **15/15** passed | PASS |
| Backend integration | **232/232** passed | PASS |
| **Total automated** | **1,054/1,054** passed | **PASS** |
| UAT — Testing Project **#73** | Creation → quotation → sandbox payment → worker assignment; on-site steps unavailable | PARTIAL |
| UAT — Exit_31 **#79** | Project progressed to contractor approval and **Completed** | COMPLETED WITH DEFECT |

## 2. Automated Testing

### Frontend

Run from the frontend directory:

```bash
npm run test:coverage
```

| Coverage | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Frontend | **91.37%** | **88.13%** | **92.11%** | **92.05%** |

### Backend

Run from `backend/` against the **local PostgreSQL test database**, not production:

```bash
DATABASE_URL="postgresql://codespace@127.0.0.1:5433/mamar_test" \
python -m pytest tests/ --cov=app --cov-report=term-missing --cov-report=html --tb=short -q
```

**Backend statement coverage:** **92%** (3,078 statements; 241 missed). The backend suite comprised 15 unit and 232 integration tests. The local test database was isolated from the deployed environment. Original test source files and detailed coverage artifacts remain in the project/test environment; this summary does not reproduce unverified code snippets.

## 3. Manual User Acceptance Testing (UAT)

### Scenario A — Testing Project #73

**Participants:** Contractor Razan; Shawahid Roads Industrial Co. (provider); field worker ID 38. **Request:** REQ-69 · **Quote:** #44, SAR 6,000.

| Verified workflow | Result |
| --- | --- |
| Project creation, work-zone polygon drawing/editing and persistence | PASS |
| Provider request visibility, quotation submission and contractor acceptance | PASS |
| PayPal **Sandbox** payment (USD 1,600; reference `1YA38794R4735640T`) | PASS |
| Notifications, project monitoring, provider assignment and worker project visibility | PASS |
| Off-site GPS: **8.2 km** away; **50 m** limit; verification prevented | PASS — negative case |
| On-site check-in, photo submission and project closure | NOT TESTED |

**Observation:** Worker could set *Work in Progress* without a visible site check-in; whether this violates requirements needs confirmation.

### Scenario B — Exit_31, Project #79

**Participants:** Contractor Razan; Safety Arabia Provider; field worker Ahmed. **Dates:** 21–29 Nov 2026. **Work zone:** 8,628.79 m². **Services:** Temporary Traffic Control; Road Signs & VMS.

| Verified workflow | Result |
| --- | --- |
| Project review, services and mapped work-zone polygon | PASS |
| Worker assignment visible on Ahmed's dashboard | PASS |
| Device `TC-014` verified at **45 m** from planned point (limit **50 m**) | PASS — UI confirmed |
| Field execution marked **Completed** | PASS |
| Photo selected; preview and **Send Photos (1)** button displayed | PASS — selection only |
| Photo visible to provider/contractor and in Final Evidence | **FAIL / OPEN ISSUE** |
| Provider completion review → contractor review → approval | PASS — observed workflow |
| Project listed as **Completed** in contractor's My Projects | PASS |

**GPS caveat:** Reported accuracy was **±143 m**, wider than the 50 m threshold. Verification succeeded, but location precision should be reviewed.

## 4. Defects & Follow-up

| Item | Finding | Status |
| --- | --- | --- |
| **BUG-PHOTO-79** | Selected site photo did not appear in provider Site Updates, contractor monitoring, or Final Evidence. Upload/persistence/display root cause not yet confirmed. | **OPEN — assigned to Shouq** |
| OBS-PROVIDER-79 | Completion review displayed **Service Provider: Not assigned** despite provider participation. | Investigate |
| OBS-CHECKIN-79 | Completion was possible while check-in was shown as **Not yet / —**. | Confirm business rule |
| OBS-GPS-79 | Device verification accepted 45 m despite ±143 m reported GPS accuracy. | Review risk |
| KNOWN-77 | Earlier quotation-submission redirect issue. | Regression retest |

## 5. Evidence & Remaining Checks

**Evidence:** Scenario #73 screenshots are catalogued separately; Scenario #79 has ten screenshots showing project review, worker assignment, GPS verification, completion, missing photos and final closure. Upload the evidence folders to `docs/testing/evidence/` and link them here when ready.

**Before final sign-off:** Fix and retest photo upload (including API response and persistence); verify on-site check-in; investigate provider association and GPS accuracy; test role permissions and key negative paths; rerun all automated suites after changes; attach original test files/coverage logs as needed.

## 6. Conclusion

**All 1,054 executed automated tests passed.** The deployed application demonstrated an end-to-end path to project completion, but the site-photo issue remains open. This is a **draft QA record**, not a final production-readiness approval.
