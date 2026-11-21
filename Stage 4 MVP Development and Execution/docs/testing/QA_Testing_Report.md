# MAMAR — Quality Assurance & Testing Report

**Project:** MAMAR — Temporary Traffic Control Management Platform  
**Stage:** Stage 4 — MVP Development and Execution  
**Report Version:** 1.0 — Final QA Review  
**Report Date:** November 21, 2026  
**Prepared By:** Razan — Project Manager & GIS Lead  
**Testing Environments:** Production Deployment and Isolated Local Test Database

---

## 1. Executive Summary

This report documents the quality assurance activities conducted during Stage 4 of the MAMAR project.

Testing was performed to evaluate the functionality, reliability, integration, and readiness of the Minimum Viable Product (MVP).

The QA process included:

- Frontend unit and component testing using Vitest.
- Backend unit and integration testing using Pytest.
- API and database integration validation.
- Manual User Acceptance Testing (UAT).
- End-to-end testing across the Contractor, Service Provider, and Field Worker roles.
- GIS work-zone and location verification testing.
- Defect identification, tracking, resolution, and retesting.
- Production deployment verification.

Automated testing demonstrated strong coverage across the frontend and backend.

Manual acceptance testing validated the primary business workflow, from project creation and service requests through quotation management, payment, field execution, and project completion.

The defects identified during final UAT were documented through GitHub Issues, addressed by the development team, and subsequently verified.

**Final QA Assessment: PASS — MVP Critical Workflows Validated**

This assessment applies to the tested MVP scope and does not constitute a production security audit, load test, or guarantee that the application is defect-free.

---

## 2. Testing Scope

### 2.1 Testing Objectives

The primary objectives were to:

1. Verify that implemented MVP features function according to their intended requirements.
2. Validate integration between the frontend, backend APIs, and PostgreSQL database.
3. Confirm that user roles can complete their designated workflows.
4. Evaluate GIS functionality, including work-zone mapping and location verification.
5. Verify the project lifecycle from creation to completion.
6. Identify and document functional defects.
7. Validate corrective actions through regression and acceptance testing.
8. Assess the readiness of the deployed MVP for Stage 4 delivery.

### 2.2 Systems and Technologies Tested

| Component | Technology | Testing Focus |
|---|---|---|
| Frontend | React | UI functionality, components, navigation, user interactions |
| Backend | FastAPI | API endpoints, business logic, authentication, validation |
| Database | PostgreSQL | Data persistence, relationships, API/database integration |
| Production Database | Supabase | Persistence through deployed application workflows |
| GIS Functionality | ArcGIS-based mapping | Work-zone geometry, project location, geographic workflows |
| Location Verification | Browser GPS and device verification | Distance restrictions and location-based validation |
| Payments | PayPal Sandbox | Test payment workflow |
| Frontend Deployment | Vercel | Production frontend accessibility and functionality |
| Backend Deployment | Render | Production API integration and application behavior |
| Version Control | GitHub | Issue tracking, code integration, and testing evidence |

### 2.3 User Roles

The end-to-end testing focused on three primary operational roles:

- **Contractor:** Creates projects, requests services, reviews quotations, completes payments, monitors execution, and approves project completion.
- **Service Provider:** Reviews service requests, submits quotations, manages assigned projects, assigns field workers, and submits completion information.
- **Field Worker:** Accesses assigned projects, performs location verification, updates field execution, and uploads site evidence.

---

## 3. Testing Methodology

MAMAR was evaluated using a combination of automated and manual testing.

### 3.1 Automated Testing

Automated testing was used to validate application components, business rules, API operations, and integration behavior.

Frontend tests were implemented using Vitest and React Testing Library.

Backend tests were implemented using Pytest and FastAPI TestClient.

Backend database tests were executed against a dedicated local PostgreSQL test database to avoid modifying production data.

### 3.2 Manual User Acceptance Testing

Manual UAT was performed on the deployed application.

Testing followed realistic user journeys across the Contractor, Service Provider, and Field Worker interfaces.

Each workflow was evaluated by comparing expected application behavior with observed results.

### 3.3 Defect Management

Issues identified during testing were documented in GitHub.

The defect management process included:

1. Identifying unexpected behavior.
2. Recording expected and actual results.
3. Creating a GitHub Issue.
4. Assigning the issue to the responsible developer.
5. Implementing and reviewing the fix.
6. Retesting the affected functionality.
7. Closing the issue after verification.

### 3.4 Test Result Classification

| Status | Definition |
|---|---|
| PASS | Functionality behaved as expected during the recorded test |
| FAIL | Functionality did not meet the expected result |
| BLOCKED | Testing could not proceed because of a dependency or limitation |
| NOT TESTED | The scenario was outside the completed execution scope |
| RESOLVED | A previously identified defect was fixed and verified |

---

## 4. Automated Testing Results

### 4.1 Frontend Unit and Component Testing

**Framework:** Vitest and React Testing Library  
**Execution Command:**

```bash
npm run test:coverage
```

The frontend test suite evaluated application components, user interactions, navigation, and related interface behavior.

#### Recorded Test Results

| Metric | Result |
|---|---:|
| Tests Passed | 806 |
| Tests Failed | 0 |
| Test Framework | Vitest |
| Result | PASS |

The latest frontend result reported during defect resolution confirmed that all 806 tests passed.

#### Previously Recorded Coverage Results

The earlier comprehensive coverage run reported:

| Coverage Metric | Result |
|---|---:|
| Statements | 91.37% |
| Branches | 88.13% |
| Functions | 92.11% |
| Lines | 92.05% |
| Test Files | 63 |
| Tests Passed in That Run | 807 |

**Coverage Note:** The coverage percentages above belong to the earlier 807-test execution. They are retained as historical coverage evidence and should not be represented as newly measured results from the subsequent 806-test run.

### 4.2 Backend Unit and Integration Testing

**Framework:** Pytest  
**Testing Tools:** FastAPI TestClient, pytest-cov  
**Database:** Dedicated local PostgreSQL test database

The backend testing covered API operations, database interactions, business logic, and user-role permissions.

#### Latest Documented Results

| Test Type | Total | Passed | Failed | Skipped |
|---|---:|---:|---:|---:|
| Unit Testing | 15 | 15 | 0 | 0 |
| Integration Testing | 240 | 240 | 0 | 0 |
| **Total** | **255** | **255** | **0** | **0** |

#### Backend Coverage

| Metric | Result |
|---|---:|
| Statement Coverage | 93% |
| Total Statements | 3,399 |
| Missed Statements | 249 |
| Backend Test Result | PASS |

The latest backend testing evidence was documented on November 20, 2026.

Tests were executed against an isolated PostgreSQL database rather than the deployed Supabase database.

The backend test suite covered:

- Authentication and role-based access.
- Project creation and status transitions.
- Service request management.
- Quotation submission, acceptance, and rejection.
- Field worker assignment and execution.
- Project milestones.
- Payment-related backend behavior.
- Notification functionality.
- Attendance and location verification.
- Device verification.
- Input validation and error handling.
- Database schema and relationships.

Payment behavior covered by automated backend tests included mocked PayPal Sandbox interactions; these tests should not be interpreted as live financial transaction tests.

### 4.3 Consolidated Automated Testing Summary

| Test Category | Passed | Failed | Skipped | Status |
|---|---:|---:|---:|---|
| Frontend Unit & Component Tests | 806 | 0 | Not reported in latest run | PASS |
| Backend Unit Tests | 15 | 0 | 0 | PASS |
| Backend Integration Tests | 240 | 0 | 0 | PASS |
| **Total Passed** | **1,061** | **0 reported** | **See notes** | **PASS** |

**Result Interpretation:** The total of 1,061 represents the sum of the latest documented frontend and backend test executions. These results were reported separately and do not establish that both suites were rerun together against the final production release.

### 4.4 Automated Testing Evidence

- [Backend Testing Issue #72](https://github.com/janaalhazmi/MAMAR/issues/72)
- [Frontend Testing Issue #73](https://github.com/janaalhazmi/MAMAR/issues/73)
- [Backend GitHub Actions Workflow](https://github.com/janaalhazmi/MAMAR/actions/workflows/backend-tests.yml)
- [Backend Testing Results](../../backend/docs/testing/BACKEND_TEST_RESULTS.md)
- [Backend Testing Evidence](../../backend/docs/testing/evidence/)

These references provide traceability to the recorded testing activities and supporting execution evidence.

---

## 5. Manual User Acceptance Testing

Manual UAT was conducted to validate complete application workflows through the deployed frontend and backend services.

Two initial test scenarios were documented, followed by production verification after defect resolution.

### 5.1 Scenario A — Testing Project #73

**Project:** Testing Project #73  
**Contractor:** Razan  
**Service Provider:** Shawahid Roads Industrial Co.  
**Field Worker:** Worker #38  
**Service Request:** REQ-69  
**Quotation:** #44  
**Quotation Amount:** SAR 6,000

#### Test Execution

| Test Case | Result |
|---|---|
| Contractor authentication | PASS |
| Project creation | PASS |
| GIS work-zone configuration | PASS |
| Polygon editing and persistence | PASS |
| Service request creation | PASS |
| Provider request visibility | PASS |
| Quotation submission | PASS |
| Contractor quotation acceptance | PASS |
| PayPal Sandbox payment | PASS |
| Notifications and project monitoring | PASS |
| Field worker assignment | PASS |
| Field worker project visibility | PASS |
| GPS restriction outside the permitted radius | PASS |
| On-site check-in | NOT TESTED |
| On-site photo upload | NOT TESTED |
| Final project closure | NOT TESTED |

#### GIS Location Verification

The field worker was approximately 8.2 km away from the assigned project location.

The application correctly prevented location verification because the worker was outside the permitted 50-meter radius.

**Result: PASS**

#### Payment Verification

The contractor completed the PayPal Sandbox payment workflow.

**Payment Amount:** USD 1,600  
**Payment Reference:** `1YA38794R4735640T`

**Result: PASS**

#### Scenario A Outcome

The scenario successfully validated project creation, GIS functionality, quotation management, payment, worker assignment, and off-site GPS restrictions.

The remaining on-site execution steps were not completed in this scenario and were evaluated through subsequent UAT activities.

**Overall Scenario Status: PARTIAL — Planned Off-Site Verification Completed**

---

### 5.2 Scenario B — Exit_31, Project #79

**Project:** Exit_31  
**Project ID:** #79  
**Contractor:** Razan  
**Service Provider:** Safety Arabia  
**Field Worker:** Ahmed  
**Project Dates:** November 21–29, 2026  
**Work Zone Area:** 8,628.79 m²  
**Services:** Temporary Traffic Control, Road Signs & VMS

#### Initial Test Execution

| Test Case | Initial Result |
|---|---|
| Project creation and work-zone configuration | PASS |
| Project assignment | PASS |
| Worker dashboard visibility | PASS |
| GPS verification within the permitted radius | PASS |
| Field execution status updated to Completed | PASS |
| Site photo selection and preview | PASS |
| Site photo visibility after upload | FAIL |
| Provider completion submission | PASS |
| Contractor completion review and approval | PASS |
| Final project status displayed as Completed | PASS |
| Correct service provider displayed in Completion Review | FAIL |

#### GIS Location Verification

Device `TC-014` was successfully verified at approximately 45 meters from the project location.

The verification distance was within the configured 50-meter threshold.

**Result: PASS**

#### Initial Findings

Two defects were identified:

1. Selected site photos were not displayed in the Provider and Contractor interfaces.
2. The Completion Review interface displayed an incorrect service provider assignment status.

Both defects were documented and assigned through GitHub Issues.

#### Scenario B Outcome

The initial test successfully progressed through the project lifecycle and reached the Completed status.

However, the photo visibility and provider information defects required corrective action and subsequent retesting.

**Initial Scenario Status: COMPLETED WITH DEFECTS**

---

## 6. Defect Tracking and Resolution

The following defects were tracked during final QA activities.

| Issue | Description | Resolution Status | Verification |
|---|---|---|---|
| #77 | Incorrect navigation after successful quotation submission | CLOSED | Verified on deployed application |
| #79 | Field worker site photos were not displayed after upload | CLOSED | Upload and visibility retested |
| #80 | Service Provider displayed as "Not Assigned" in Completion Review | CLOSED | Correct provider displayed after deployment |

### 6.1 Issue #77 — Provider Dashboard Navigation

**Issue:** [#77 — Fix Provider Dashboard Navigation After Successful Quotation Submission](https://github.com/janaalhazmi/MAMAR/issues/77)

#### Original Defect

After successful quotation submission, the Service Provider interface did not navigate as expected.

#### Implemented Changes

The development team documented the following improvements:

- Corrected navigation after quotation submission.
- Redirected the user to the Provider Dashboard.
- Added success notifications.
- Simplified quotation-related actions.
- Updated affected frontend tests.

#### Verification Results

The issue documentation reported:

- 23 tests passed.
- 0 failed tests.
- Successful verification on the deployed application.

**Final Status: RESOLVED — CLOSED**

### 6.2 Issue #79 — Field Worker Site Photo Upload

**Issue:** [#79 — Field Worker Site Photos Are Not Displayed After Upload](https://github.com/janaalhazmi/MAMAR/issues/79)

#### Original Defect

During UAT, the Field Worker selected a site photo, but the photo did not appear in the Provider or Contractor interfaces.

#### Root Cause

The development investigation identified that selecting a photo initially created a preview without immediately saving it.

The upload required a separate action, creating a risk that the photo would be lost if the user left the page before completing the upload.

#### Implemented Fix

The development team updated the photo workflow to:

- Upload the photo when selected.
- Display confirmation after successful saving.
- Clearly indicate unsuccessful uploads.
- Provide a retry option when saving fails.
- Warn users before leaving the page with unsaved photos.
- Support Before, During, and After photo classification.

#### Retesting Results

The development team reported:

- Updated photo-related frontend tests.
- Successful frontend test execution.
- Photo visibility after refreshing the worker interface.
- Photo visibility in the Provider project interface.
- Photo visibility in Contractor Project Monitoring.

The final production verification also confirmed that site photos could be uploaded and displayed successfully.

**Final Status: RESOLVED — CLOSED**

### 6.3 Issue #80 — Incorrect Service Provider Information

**Issue:** [#80 — Service Provider Shows as "Not Assigned" in Completion Review](https://github.com/janaalhazmi/MAMAR/issues/80)

#### Original Defect

The Contractor Completion Review interface displayed:

`Service Provider: Not Assigned`

This occurred despite an assigned Service Provider having participated in the project workflow.

#### Corrective Action

The development team resolved the issue and closed the corresponding GitHub Issue.

#### Retesting Results

Following deployment of the updated application, the Completion Review interface was verified again.

The interface correctly displayed the assigned Service Provider:

**Safety Arabia Co. LTD**

The provider information was also displayed correctly in Project Monitoring.

**Final Status: RESOLVED — CLOSED**

---

## 7. Final Production Verification

**Verification Date:** November 21, 2026  
**Environment:** Production  
**Frontend Hosting:** Vercel  
**Backend Hosting:** Render  
**Database Hosting:** Supabase

Following the integration of development changes into the `main` branch, the deployment configuration was updated to align the production environments with the release branch.

The updated application was then accessed through its production URL.

### 7.1 Deployment Verification

| Verification Item | Result |
|---|---|
| Frontend production deployment completed | PASS |
| Production frontend accessible | PASS |
| Frontend configured to deploy from `main` | PASS |
| Backend deployment branch updated | PASS |
| Application accessible after deployment | PASS |
| Contractor dashboard accessible | PASS |
| Project Monitoring accessible | PASS |
| Completion Review accessible | PASS |

### 7.2 End-to-End Workflow Verification

The final manual verification confirmed the critical MVP workflow, including:

1. Contractor project creation.
2. GIS work-zone configuration.
3. Service request creation.
4. Service Provider quotation submission.
5. Contractor quotation review and acceptance.
6. Payment workflow.
7. Field worker assignment.
8. Device and location verification.
9. Field execution updates.
10. Site photo upload and visibility.
11. Provider completion submission.
12. Contractor completion review.
13. Final project completion.

### 7.3 Post-Fix Regression Verification

| Test Area | Final Result |
|---|---|
| Project creation and persistence | PASS |
| GIS work-zone configuration | PASS |
| Service request and quotation workflow | PASS |
| Payment workflow | PASS |
| Field worker assignment | PASS |
| Location verification | PASS |
| Field execution workflow | PASS |
| Site photo upload | PASS |
| Site photo visibility | PASS |
| Service Provider information display | PASS |
| Contractor monitoring | PASS |
| Completion review | PASS |
| Project completion | PASS |

**Overall Production Verification Result: PASS**

The recorded production verification confirmed that the previously identified photo upload and provider display defects were resolved.

---

## 8. Testing Evidence and Traceability

Testing evidence was collected through automated test reports, GitHub Issues, development verification records, and manual UAT screenshots.

### 8.1 Automated Testing Evidence

| Evidence | Reference |
|---|---|
| Backend Unit & Integration Testing | [Issue #72](https://github.com/janaalhazmi/MAMAR/issues/72) |
| Frontend Unit & Component Testing | [Issue #73](https://github.com/janaalhazmi/MAMAR/issues/73) |
| Backend CI Execution | [GitHub Actions](https://github.com/janaalhazmi/MAMAR/actions/workflows/backend-tests.yml) |
| Backend Test Report | [BACKEND_TEST_RESULTS.md](../../backend/docs/testing/BACKEND_TEST_RESULTS.md) |
| Backend Evidence | [Evidence Directory](../../backend/docs/testing/evidence/) |

### 8.2 Manual Testing Evidence

Manual UAT screenshots were captured to document:

- Contractor dashboard and project creation.
- GIS work-zone configuration.
- Service request and quotation workflows.
- Payment confirmation.
- Field worker assignment.
- GPS and device verification.
- Field execution updates.
- Site photo functionality.
- Project Monitoring.
- Completion Review.
- Final project status.

**Evidence Directory:** `docs/testing/evidence/`

Individual screenshots should be referenced by their actual repository paths once uploaded.

### 8.3 Related GitHub Issues

| Issue | Description |
|---|---|
| [#72](https://github.com/janaalhazmi/MAMAR/issues/72) | Backend Unit & Integration Testing |
| [#73](https://github.com/janaalhazmi/MAMAR/issues/73) | Frontend Unit & Component Testing |
| [#74](https://github.com/janaalhazmi/MAMAR/issues/74) | Testing Documentation & Quality Assurance Report |
| [#77](https://github.com/janaalhazmi/MAMAR/issues/77) | Provider Dashboard Navigation Fix |
| [#78](https://github.com/janaalhazmi/MAMAR/issues/78) | MVP End-to-End Validation & Acceptance Testing |
| [#79](https://github.com/janaalhazmi/MAMAR/issues/79) | Field Worker Site Photo Upload Fix |
| [#80](https://github.com/janaalhazmi/MAMAR/issues/80) | Service Provider Display Fix |

### 8.4 Source Code and Deployment

- [MAMAR GitHub Repository](https://github.com/janaalhazmi/MAMAR)
- [MAMAR Production Application](https://mammar-blush.vercel.app/)
- [GitHub Project Board](https://github.com/users/janaalhazmi/projects/6)

---

## 9. Limitations and Testing Considerations

Although the critical MVP workflows were validated, the following considerations remain relevant.

### 9.1 Automated Testing Environment

Backend automated tests were executed using an isolated local PostgreSQL database.

These tests validate backend behavior and database integration but do not independently verify the production Supabase environment.

Production database integration was evaluated through the deployed application's manual workflows.

### 9.2 Payment Environment

Payment validation was conducted using PayPal Sandbox.

No live financial transactions were required for MVP acceptance testing.

### 9.3 GIS and GPS Accuracy

Location verification was evaluated using recorded device and browser location information.

Real-world GPS accuracy can vary depending on device capabilities, environmental conditions, and location permissions.

The successful verification cases confirm the observed application behavior under the recorded test conditions.

### 9.4 Scope of Manual Testing

Manual UAT focused on the primary MVP business workflow and identified integration defects.

Not every possible user interaction, device type, browser configuration, or failure condition was exhaustively tested.

### 9.5 Performance and Security

A dedicated production load-testing exercise and comprehensive penetration test were not documented as part of this QA cycle.

These activities are recommended before a broader commercial production rollout.

### 9.6 Evidence Completeness

Automated test reports and GitHub Issues provide traceable testing records.

Manual screenshots were captured during testing; their individual repository references should be maintained in the evidence directory.

---

## 10. Final QA Assessment

### 10.1 Acceptance Summary

| Acceptance Area | Assessment |
|---|---|
| Frontend automated testing | PASS |
| Backend unit testing | PASS |
| Backend integration testing | PASS |
| Contractor workflow | PASS |
| Service Provider workflow | PASS |
| Field Worker workflow | PASS |
| GIS work-zone functionality | PASS |
| Location verification | PASS |
| Payment Sandbox workflow | PASS |
| Site photo upload and visibility | PASS |
| Project monitoring | PASS |
| Project completion | PASS |
| Critical defect resolution | PASS |
| Production application verification | PASS |

### 10.2 Quality Assessment

The recorded automated tests passed successfully.

Manual UAT validated the critical workflows required to demonstrate the operational MVP.

The functional defects identified during final acceptance testing were documented, corrected, and verified.

The deployed application was successfully accessed and tested following the final integration and deployment updates.

### 10.3 Final Conclusion

The MAMAR MVP has successfully completed the documented Stage 4 quality assurance activities.

The project demonstrated:

- Functional integration across its primary user roles.
- Successful execution of the critical project lifecycle.
- Working GIS and location-based functionality.
- Successful payment workflow validation using PayPal Sandbox.
- Successful field execution and photo evidence workflows.
- Effective defect identification, resolution, and retesting.
- Successful deployment and production verification.

**Final QA Status: PASS**

**Stage 4 MVP Assessment: READY FOR ACADEMIC DELIVERY**

This conclusion is based on the documented MVP acceptance scope, automated test evidence, and manual production verification.

Further performance, security, and scalability testing is recommended before a full commercial launch.

---

**End of QA & Testing Report**
