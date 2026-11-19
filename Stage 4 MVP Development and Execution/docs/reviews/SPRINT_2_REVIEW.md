# MAMAR – Sprint 2 Review and Retrospective

> **Documentation note:** This report was compiled retrospectively on November 20, 2026 from the Sprint 2 GitHub Projects task list and the documented Sprint 1 follow-up actions. It is a records-based review, **not evidence that a Sprint 2 review or retrospective meeting took place during October 18–24**. Historical task status at the sprint deadline was not independently verified.

## 1. Sprint Overview

| Item | Details |
| --- | --- |
| Project | MAMAR – Temporary Traffic Control Management Platform |
| Stage | Stage 4: MVP Development and Execution |
| Sprint | Sprint 2 |
| Sprint Period | October 18–24, 2026 |
| Documentation Date | November 20, 2026 (retrospective compilation) |
| Sprint Duration | 1 Week |
| Project Management Tool | GitHub Projects |
| Version Control | GitHub |
| Development Approach | Agile / Scrum-Inspired Workflow |

### Team Members and Responsibilities

| Team Member | Role |
| --- | --- |
| Razan Kashr | Project Manager, GIS Lead, and QA |
| Jana Alhazmi | Frontend Developer and Source Control Management |
| Kayan Alnazari | Frontend Developer and QA |
| Shouq Alqarni | Backend Developer |

## 2. Sprint Objectives

Sprint 2 focused on making authentication and the home-page experience work across the frontend, backend APIs, and database, while addressing integration issues identified in Sprint 1.

The tracked objectives were:

1. Complete frontend authentication integration.
2. Finalize authentication API and database integration.
3. Implement logout and session management.
4. Resolve frontend–backend connection issues.
5. Execute authentication and home-page QA tests.
6. Review sprint progress and prepare meeting evidence.
7. Fix registration API integration and account creation.

## 3. Sprint 2 Deliverables

### 3.1 Frontend Development

GitHub Projects records the following Sprint 2 tasks as **Done** as of November 20, 2026:

- [#14 – Complete Authentication Frontend Integration](https://github.com/janaalhazmi/MAMAR/issues/14)
- [#16 – Implement Logout and Session Management](https://github.com/janaalhazmi/MAMAR/issues/16)
- [#21 – Fix Registration API Integration and Account Creation](https://github.com/janaalhazmi/MAMAR/issues/21)

These tasks address the frontend authentication and registration concerns documented in the Sprint 1 review. Their current board status does not independently establish the exact completion date or test outcome during Sprint 2.

### 3.2 Backend Development and Database Integration

- [#15 – Finalize Authentication API and Database Integration](https://github.com/janaalhazmi/MAMAR/issues/15) — **Done** in the November 20 board snapshot.
- [#18 – Resolve Frontend–Backend Connection Issues](https://github.com/janaalhazmi/MAMAR/issues/18) — **Done** in the same snapshot.

The tracked work concerns authentication endpoints, registration compatibility, and frontend-to-backend connectivity. This retrospective summary does not claim specific implementation details that have not been verified from the associated code or pull requests.

### 3.3 Quality Assurance

- [#19 – Execute Authentication and Home Page QA Tests](https://github.com/janaalhazmi/MAMAR/issues/19) — **Done** in the November 20 board snapshot.

The task status confirms tracking completion; detailed Sprint 2 test cases, execution logs, and defect counts should be linked separately if available. No unverified test counts or pass rates are asserted here.

### 3.4 Project Management and Source Control

- [#20 – Review Sprint 2 Progress and Prepare Meeting 7 Evidence](https://github.com/janaalhazmi/MAMAR/issues/20) — **Done** in the November 20 board snapshot.

Sprint tasks were organized through GitHub Projects, with repository issues providing traceability to the recorded work. The issue title references meeting evidence, but the board snapshot alone does not verify that a review meeting occurred or that a retrospective was conducted.

### 3.5 Sprint 2 Progress Tracking

The **current** GitHub Projects snapshot supplied on November 20, 2026 shows:

| Status | Number of Tasks |
| --- | ---: |
| Done | 7 |
| In Progress | 0 |
| Todo | 0 |
| **Total** | **7** |

**Current recorded completion: 7/7 (100%).** This is not a verified historical completion percentage as of October 24, 2026; tasks may have changed status after the sprint ended.

## 4. Quality Assurance Review

### 4.1 Review Scope

The Sprint 2 QA task covered authentication and the home-page workflow. Relevant checks for this scope include registration, login, logout, session handling, frontend–backend API communication, and account creation.

### 4.2 Evidence and Verification Status

The QA task [#19](https://github.com/janaalhazmi/MAMAR/issues/19) is marked **Done** in the current project board. However, this document does not have an independently verified Sprint 2 execution log, test case matrix, or pass/fail breakdown. Detailed results should not be inferred from the issue status alone.

### 4.3 Follow-up from Sprint 1

Sprint 1 documented authentication field mismatches, temporary frontend authentication, navigation issues, and backend authorization concerns. Sprint 2 tracked work relevant to authentication integration and connectivity. Whether every Sprint 1 security and navigation finding was fully resolved by the end of Sprint 2 requires issue/PR-level verification.

## 5. Challenges and Deviations

### 5.1 Authentication Contract Alignment

**Documented predecessor issue:** Sprint 1 identified differences between frontend registration fields and backend API requirements.

**Tracked Sprint 2 response:** Authentication integration [#14](https://github.com/janaalhazmi/MAMAR/issues/14), API/database integration [#15](https://github.com/janaalhazmi/MAMAR/issues/15), and registration fixes [#21](https://github.com/janaalhazmi/MAMAR/issues/21).

### 5.2 Frontend–Backend Connectivity

**Documented predecessor issue:** Sprint 1 identified outstanding integration and deployed connectivity verification.

**Tracked Sprint 2 response:** [#18 – Resolve Frontend–Backend Connection Issues](https://github.com/janaalhazmi/MAMAR/issues/18).

### 5.3 Testing Evidence

**Documentation limitation:** A current **Done** status does not by itself supply historical test logs or prove completion within the sprint period.

**Improvement:** Preserve test execution evidence and dated review outcomes alongside the task record in future sprints.

## 6. Sprint Review Outcome

Based on the November 20 GitHub Projects snapshot, all seven tasks assigned to Sprint 2 are currently marked **Done**. The recorded work covers authentication integration, logout/session management, registration, API connectivity, QA, and progress review.

**Outcome classification:** **Completed in the current project board; historical October 24 sign-off not independently verified.** This section is a retrospective records review rather than minutes of a contemporaneous sprint review meeting.

## 7. Sprint Retrospective

> The points below are **retrospective observations inferred from documented work and Sprint 1 findings**, not statements attributed to an unverified team retrospective meeting.

### 7.1 What Went Well

- Sprint 2 tasks focused on a coherent authentication and integration milestone.
- The tracked work explicitly covered frontend, backend, database, session handling, and QA.
- GitHub Issues provided traceable identifiers for the seven sprint tasks.

### 7.2 What Could Be Improved

- Record the status of each task **at the actual sprint close**, not only in later board snapshots.
- Link test execution evidence directly to QA issues.
- Keep frontend and backend registration contracts documented together.
- Distinguish code completion, QA verification, and sprint acceptance in review notes.

### 7.3 Suggested Action Items for Sprint 3

| Action Item | Suggested Owner / Workstream |
| --- | --- |
| Validate project location selection and polygon drawing against GIS requirements | GIS Lead / Frontend |
| Execute functional and GIS QA tests with reproducible evidence | QA |
| Preserve dated sprint review notes and links to associated PRs | PM / SCM |
| Carry forward any unresolved authentication or integration findings | Frontend / Backend / QA |

These are recommendations based on the records, **not verified historical assignments**.

## 8. Next Steps

Sprint 3 was scheduled for **October 25–31, 2026**. Its GitHub Projects tasks focused on fixing project location selection and polygon drawing [#27](https://github.com/janaalhazmi/MAMAR/issues/27), and executing functional and GIS QA tests [#29](https://github.com/janaalhazmi/MAMAR/issues/29).

## 9. Conclusion

Sprint 2's tracked scope addressed authentication and frontend–backend integration, directly following the technical priorities documented in Sprint 1. As of November 20, all seven Sprint 2 issues are recorded as **Done**. Historical sprint-end completion, detailed QA evidence, and the occurrence of a formal retrospective meeting remain unverified in this report.

---

**Prepared as:** Retrospective documentation from project records  
**Project:** MAMAR  
**Documentation date:** November 20, 2026  
**Primary references:** [GitHub Sprint Metrics](https://github.com/users/janaalhazmi/projects/6/views/3) · [Sprint 1 Review](SPRINT_1_REVIEW.md)
