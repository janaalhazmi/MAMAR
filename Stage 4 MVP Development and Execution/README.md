# MAMAR — Stage 4: MVP Development and Execution

**Project:** MAMAR | **Stage:** 4 — MVP Development and Execution  
**Period:** October 11 – November 21, 2026 | **Methodology:** Agile | **Duration:** 6 one-week sprints  
**Status (November 21, 2026):** Stage 4 completed. All six sprints finalized, MVP deployed and verified, and final QA assessment passed.

## 1. Project Overview

MAMAR is a GIS-enabled B2B platform connecting contractors working on roads and construction sites with temporary traffic control service providers. Contractors define geographic work zones, request traffic control services, compare provider quotations, and monitor execution. Providers manage quotations and field assignments, while field workers access assigned projects and verify traffic control devices against their planned locations.

Stage 4 translates the requirements and technical design from Stage 3 into a working Minimum Viable Product (MVP). Work is organized into six Agile sprints, with assigned responsibilities, Git-based collaboration, progress tracking, reviews, and quality assurance.

### Stage Objectives

- Implement the approved MVP scope through iterative development.
- Break user stories into prioritized, assigned sprint tasks with dependencies and deadlines.
- Coordinate frontend, backend, database, and GIS integration.
- Maintain codebase integrity through source control and review practices.
- Track progress, address blockers, and document sprint feedback.
- Validate integrated workflows before final Stage 4 sign-off.

## 2. Team Roles and Responsibilities

| Team member | Stage 4 role | Main responsibilities |
| --- | --- | --- |
| **Razan Kashr** | Project Manager (PM) & GIS Lead Integration | Sprint planning and coordination, task tracking, priorities, dependencies, GIS work-zone integration, and end-to-end validation coordination. |
| **Jana Alhazmi** | Frontend Developer, UI/UX Integration & Source Control Manager (SCM) | React interface development, UI integration, repository organization, branching and pull-request coordination. |
| **Kayan Alnazari** | Frontend Developer & Quality Assurance (QA) | React pages and workflows, test coordination, bug documentation, and verification of completed functionality. |
| **Shouq Alqarni** | Backend Developer | FastAPI endpoints, PostgreSQL data models, business logic, authentication, and backend testing. |

All members contribute to testing, code review, integration, and resolving issues within their assigned areas. PM, SCM, and QA are distinct responsibilities even when a team member also develops features.

## 3. Task 0 — Plan and Define Sprints

### Agile Planning Approach

The team planned **six one-week sprints** and organized work in GitHub Projects. Tasks are prioritized using the **MoSCoW** method (Must Have, Should Have, Could Have, Won't Have), with owners, deadlines, and dependencies tracked through project items and GitHub Issues.

### Sprint Schedule — Official Meeting-Plan Order

The goals below follow the Stage 4 meeting-plan sequence provided by Holberton. Dates reflect the team's six-week Stage 4 schedule. These are the original sprint targets; final completion is documented separately through GitHub Projects and sprint reviews.

| Sprint | Dates | Planned goal |
| --- | --- | --- |
| **Sprint 1** | **Oct 11–17, 2026** | Project setup, timeline, and task planning. |
| **Sprint 2** | **Oct 18–24, 2026** | End-to-end authentication and homepage completion. |
| **Sprint 3** | **Oct 25–31, 2026** | Reach 50% of the main MVP features. |
| **Sprint 4** | **Nov 1–7, 2026** | Reach 100% of the main MVP features. |
| **Sprint 5** | **Nov 8–14, 2026** | Secondary features and third-party integrations. |
| **Sprint 6** | **Nov 15–21, 2026** | QA testing and optional features. |

### Priorities and Dependencies

**Must Have:** authentication and role-aware workflows; contractor project management; GIS work-zone definition; service requests; provider quotations and contractor selection; field worker assignment; location-based device verification; integrated backend and database operations.

**Should Have:** project monitoring, role-specific dashboards, execution evidence, and notifications.

**Could Have:** advanced analytics and optional enhancements.

**Out of scope for core MVP:** continuous real-time GPS tracking and automated engineering traffic-control-plan generation.

**Scope note:** The original Stage 4 plan excluded online payments. A **PayPal Sandbox** payment flow was subsequently integrated and exercised during UAT; this is a scope addition for demonstration/testing, **not evidence of live payment processing**.

Key dependencies: authentication APIs precede role-specific workflows; projects precede work-zone storage and service requests; service requests precede quotations; accepted quotations precede provider assignments; device/location data precede field verification; integration precedes final end-to-end validation.

## 4. Task 1 — Execute Development Tasks

### Technology Stack

| Layer | Technology / service | Purpose |
| --- | --- | --- |

Progress-monitoring practices included team check-ins, reviewing deliverables against sprint goals, tracking integration blockers, assigning fixes, and reprioritizing tasks as needed. Examples of technical follow-up included frontend/backend integration, schema and test adjustments, Git merge conflicts, and UAT findings.

### Sprint Performance Metrics

Project progress was monitored through GitHub Projects using sprint assignments, task statuses, and completion rates.

The following metrics reflect the **final project status as of November 21, 2026**.

| Sprint | Period | Total Tasks | Completed | In Progress | To Do | Completion Rate |
|--------|--------|-------------|-----------|-------------|-------|-----------------|
| Sprint 1 | Oct 11–17 | 9 | 9 | 0 | 0 | 100% |
| Sprint 2 | Oct 18–24 | 7 | 7 | 0 | 0 | 100% |
| Sprint 3 | Oct 25–31 | 2 | 2 | 0 | 0 | 100% |
| Sprint 4 | Nov 1–7 | 4 | 4 | 0 | 0 | 100% |
| Sprint 5 | Nov 8–14 | 4 | 4 | 0 | 0 | 100% |
| Sprint 6 | Nov 15–21 | 7 | 7 | 0 | 0 | 100% |
| **Total** | **Oct 11–Nov 21** | **33** | **33** | **0** | **0** | **100%** |

**Performance Indicators:**

- **Overall Task Completion:** 100% (33 of 33 tracked tasks).
- **Completed Sprints:** All six sprints achieved 100% completion of their recorded tasks.
- **Sprint 6:** All seven tracked tasks completed, including final QA, documentation, end-to-end validation, and defect resolution.
- **Defect Resolution:** Sprint 6 issues #77, #79, and #80 were resolved and marked Done.
- **Progress Tracking:** GitHub Projects was used to monitor task completion, priorities, and issue resolution.
- **Final Stage 4 Status:** Completed.

**Measurement Method:** Completion rates are calculated from the final task statuses in GitHub Projects. These figures represent the completion of recorded sprint tasks, not a historical baseline of originally planned tasks or story-point velocity.

[View Final Sprint Metrics](https://github.com/users/janaalhazmi/projects/6/views/3)

## 6. Task 3 — Conduct Sprint Reviews and Retrospectives

### Sprint Reviews & Retrospectives Documentation

Sprint reviews and retrospective summaries were documented to evaluate sprint deliverables, identify challenges, and record improvements for subsequent iterations.

| Sprint | Period | Documentation |
|---|---|---|
| Sprint 1 | Oct 11–17, 2026 | [Sprint 1 Review & Retrospective](docs/reviews/SPRINT_1_REVIEW.md) |
| Sprint 2 | Oct 18–24, 2026 | [Sprint 2 Review & Retrospective](docs/reviews/SPRINT_2_REVIEW.md) |
| Sprint 3 | Oct 25–31, 2026 | [Sprint 3 Review & Retrospective](docs/reviews/SPRINT_3_REVIEW.md) |
| Sprint 4 | Nov 1–7, 2026 | [Sprint 4 Review & Retrospective](docs/reviews/SPRINT_4_REVIEW.md) |
| Sprint 5 | Nov 8–14, 2026 | [Sprint 5 Review & Retrospective](docs/reviews/SPRINT_5_REVIEW.md) |
| Sprint 6 | Nov 15–21, 2026 | [Sprint 6 Final Review & Retrospective](docs/reviews/SPRINT_6_REVIEW.md) |

Documentation Note: Sprint 2–5 reviews were compiled retrospectively from project records and GitHub task tracking. Sprint 6 Review and Retrospective were conducted and documented during the scheduled sprint period (November 15–21, 2026), reflecting the team's actual review activities, final deliverables, defect resolution, and QA verification.

The final Sprint 6 review confirms the completion of all seven tracked tasks and the successful conclusion of Stage 4.

## 7. Task 4 — Final Integration and QA Testing

Stage 4 includes automated frontend/backend tests and manual user acceptance testing across Contractor, Service Provider, and Field Worker roles.

End-to-end scenarios exercised the core flow from project creation and GIS work-zone definition through service requests, quotations, provider selection, payment demonstration, field assignment, location verification, site photo uploads, project monitoring, and project completion.

The final QA activities included:

- Backend unit and integration testing using Pytest.
- Frontend unit and component testing using Vitest.
- Manual end-to-end acceptance testing.
- GIS work-zone and location verification.
- Frontend, backend, and database integration verification.
- Defect resolution and regression testing.
- Verification of the deployed application following the final integration into `main`.

**Final QA Status: PASS**

**Stage 4 MVP Assessment: READY FOR ACADEMIC DELIVERY**

**The authoritative record for test counts, coverage, scenario-level outcomes, evidence, and defect-resolution results is the [QA & Testing Report](docs/testing/QA_Testing_Report.md).**

This README deliberately avoids duplicating detailed testing results so that test documentation remains in one maintained location.

The final assessment confirms completion of the documented Stage 4 MVP acceptance scope. Further performance, security, and scalability testing is recommended before a full commercial launch.

## 8. Task 5 — Deliverables

The following table summarizes the required Stage 4 deliverables, their documentation, and their final status.

| Required Deliverable | Link / Current Location | Status |
|---|---|---|
| **Sprint Planning** | [Sprint 2 Plan](docs/planning/SPRINT_2_PLAN.md) · [GitHub Project Board](https://github.com/users/janaalhazmi/projects/6) | Completed. Sprint tasks, assignments, priorities, dependencies, and progress are documented through GitHub Projects. |
| **Sprint Reviews** | [Sprint 1](docs/reviews/SPRINT_1_REVIEW.md) · [Sprint 2](docs/reviews/SPRINT_2_REVIEW.md) · [Sprint 3](docs/reviews/SPRINT_3_REVIEW.md) · [Sprint 4](docs/reviews/SPRINT_4_REVIEW.md) · [Sprint 5](docs/reviews/SPRINT_5_REVIEW.md) · [Sprint 6](docs/reviews/SPRINT_6_REVIEW.md) | Completed. Review documentation is available for all six sprints, including the final Sprint 6 review. |
| **Sprint Retrospectives** | [Sprint 1](docs/reviews/SPRINT_1_REVIEW.md) · [Sprint 2](docs/reviews/SPRINT_2_REVIEW.md) · [Sprint 3](docs/reviews/SPRINT_3_REVIEW.md) · [Sprint 4](docs/reviews/SPRINT_4_REVIEW.md) · [Sprint 5](docs/reviews/SPRINT_5_REVIEW.md) · [Sprint 6](docs/reviews/SPRINT_6_REVIEW.md) | Completed. Retrospective summaries are included in the sprint review documents. Sprint 2–5 summaries were compiled retrospectively from project records, while Sprint 6 Review and Retrospective were conducted and documented during the scheduled sprint period (November 15–21, 2026). |
| **Source Repository** | [MAMAR Repository — main Branch](https://github.com/janaalhazmi/MAMAR/tree/main) | Available. Contains the integrated frontend, backend, project documentation, and testing resources. |
| **Bug Tracking** | [GitHub Issues](https://github.com/janaalhazmi/MAMAR/issues) · [GitHub Project Board](https://github.com/users/janaalhazmi/projects/6) | Completed for the documented Sprint 6 scope. Identified defects #77, #79, and #80 were resolved and marked Done. |
| **Testing Evidence and Results** | [QA & Testing Report](docs/testing/QA_Testing_Report.md) · [Sprint 1 QA Test Cases](docs/testing/QA_TEST_CASES_SPRINT1.md) · [Project #83 End-to-End UAT Evidence](docs/testing/evidence/UAT-008-project-83-end-to-end/README.md) | Automated testing results and manual UAT evidence are documented, including 16 screenshots covering the contractor, service provider, and field worker workflows. |
| **Production Environment** | [MAMAR Live Application](https://mammar-blush.vercel.app/) · [Backend API](https://mamar-api.onrender.com) · [Swagger API Documentation](https://mamar-api.onrender.com/docs) · Database: Supabase (PostgreSQL) | Deployed and verified. Frontend and backend deployment configurations were aligned with the `main` branch. |

### Submission Checklist

- [x] Organize development tasks and sprint tracking through GitHub Projects.
- [x] Document sprint reviews and retrospective summaries for all six sprints.
- [x] Provide access to the source code repository.
- [x] Establish bug tracking through GitHub Issues.
- [x] Document automated testing results and manual UAT findings.
- [x] Verify that all documentation links are accessible and up to date.
- [x] Update the Sprint 6 review with its final completion status.
- [x] Document UAT execution evidence and results in the QA report.
- [x] Upload and organize the Project #83 end-to-end UAT screenshots in `docs/testing/evidence/UAT-008-project-83-end-to-end/`.
- [x] Resolve the tracked Sprint 6 defects and document regression testing results.
- [x] Add the verified deployed application URL.
- [x] Complete the final QA review and academic delivery assessment.

**Documentation Note:** Sprint review and retrospective summaries are maintained in `docs/reviews/`. Detailed test results, coverage metrics, UAT outcomes, and defect evidence are maintained separately in the QA & Testing Report to avoid duplication and ensure consistent reporting.

## 9. Repository Structure

The Stage 4 repository is organized into dedicated directories for frontend development, backend services, sprint documentation, and quality assurance.

```text
Stage 4 MVP Development and Execution/
│
├── backend/
│
├── frontend/
│
├── docs/
│   │
│   ├── planning/
│   │   └── SPRINT_2_PLAN.md
│   │
│   ├── reviews/
│   │   ├── SPRINT_1_REVIEW.md
│   │   ├── SPRINT_2_REVIEW.md
│   │   ├── SPRINT_3_REVIEW.md
│   │   ├── SPRINT_4_REVIEW.md
│   │   ├── SPRINT_5_REVIEW.md
│   │   └── SPRINT_6_REVIEW.md
│   │
└── testing/
    ├── QA_TEST_CASES_SPRINT1.md
    ├── QA_Testing_Report.md
    └── evidence/
        ├── README.md
        └── UAT-008-project-83-end-to-end/
            ├── README.md
            ├── evidence-index.csv
            └── 16 numbered screenshots (.png)
│
├── README.md
└── package-lock.json
```

The structure reflects the Stage 4 directory on the `main` branch, where the final integrated development work and documentation are maintained.

## 10. Stage 4 Status and Next Steps

As of **November 21, 2026**, MAMAR has successfully completed Stage 4: MVP Development and Execution.

The project was developed through six Agile sprints, with all **33 tracked tasks completed (100%)**.

The integrated MVP supports the main contractor–provider–field-worker workflow, including GIS-enabled project creation, service requests, quotations, field execution, location verification, site evidence, and project completion.

The final integration was merged into the `main` branch, and the deployed application was verified following the production updates.

Automated testing, manual acceptance testing, defect resolution, and QA documentation were completed within the documented MVP acceptance scope.

**Final Stage 4 Status: COMPLETED**

**Sprint Completion: 6/6 Sprints — 100%**

**Tracked Task Completion: 33/33 — 100%**

**Final QA Status: PASS**

**MVP Assessment: READY FOR ACADEMIC DELIVERY**

Future development may include expanded automated end-to-end testing, additional security assessments, performance testing, and scalability improvements before a full commercial launch.

For the final verified QA status, see the [QA & Testing Report](docs/testing/QA_Testing_Report.md); for sprint performance and issue tracking, see the [GitHub Project](https://github.com/users/janaalhazmi/projects/6) and [GitHub Issues](https://github.com/janaalhazmi/MAMAR/issues).

---

**End of Stage 4 — MVP Development and Execution**
