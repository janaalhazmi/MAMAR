# MAMAR — Stage 4: MVP Development and Execution

**Project:** MAMAR | **Stage:** 4 — MVP Development and Execution  
**Period:** October 11 – November 21, 2026 | **Methodology:** Agile | **Duration:** 6 one-week sprints  
**Status (November 19, 2026):** MVP deployed for testing; final validation and documentation in progress.

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

The goals below follow the Stage 4 meeting-plan sequence provided by Holberton. Dates reflect the team's six-week Stage 4 schedule. These are **sprint targets**, not claims that every item was completed on its target date.

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
| Frontend | React, JavaScript | Role-specific interfaces and workflow screens. |
| Backend | FastAPI, SQLAlchemy, Pydantic | REST APIs, validation, and business logic. |
| Database | PostgreSQL | Persistent project, request, quotation, assignment, and user data. |
| GIS | ArcGIS mapping integration and browser geolocation | Interactive work-zone mapping and location-based verification. |
| Deployment | Vercel (Frontend), Render (Backend), Supabase (PostgreSQL Database) | Cloud hosting for the frontend, backend APIs, and PostgreSQL database. |
| Collaboration | Git, GitHub, GitHub Projects | Source control, issue tracking, and sprint coordination. |

### Implementation Workstreams

**Foundation and authentication:** development environments, repository structure, backend/database setup, login and role-based application entry points.

**Contractor workflows:** project creation and editing; mapped work-zone polygons; service request submission; quotation review and provider selection; project monitoring and completion approval.

**Provider workflows:** visibility of relevant service requests, quotation submission, project/field-worker assignment, and completion review.

**Field workflows:** assigned project visibility, mapped locations, device verification with a distance threshold, execution updates, and site-evidence interfaces.

**Integration:** React-to-FastAPI communication, PostgreSQL persistence, GIS display and polygon retention, notifications, and a PayPal Sandbox payment demonstration.

**Implementation note:** These workstreams describe features developed and exercised during Stage 4. They do not imply that every workflow is defect-free; open items are tracked separately.

### Source Control and Collaboration

Feature work was coordinated through GitHub branches, commits, pull requests, and the shared `develop` branch. SCM responsibilities include reviewing changes, managing merges, and maintaining repository structure. GitHub Issues and project-board statuses provide traceability from planned tasks to implementation and follow-up.

## 5. Task 2 — Monitor Progress and Adjust

The PM coordinated sprint tasks, dependencies, deadlines, and blockers through the [MAMAR GitHub Project](https://github.com/users/janaalhazmi/projects/6) and [repository Issues](https://github.com/janaalhazmi/MAMAR/issues). The team used task statuses to distinguish work not started, in progress, under review, and completed.

Progress-monitoring practices included team check-ins, reviewing deliverables against sprint goals, tracking integration blockers, assigning fixes, and reprioritizing tasks as needed. Examples of technical follow-up included frontend/backend integration, schema and test adjustments, Git merge conflicts, and UAT findings.

### Sprint Performance Metrics

Project progress was monitored through GitHub Projects using sprint assignments, task statuses, and completion rates.

The following metrics reflect the project status as of November 20, 2026.

| Sprint | Period | Total Tasks | Completed | In Progress | To Do | Completion Rate |
|--------|--------|-------------|-----------|-------------|-------|-----------------|
| Sprint 1 | Oct 11–17 | 9 | 9 | 0 | 0 | 100% |
| Sprint 2 | Oct 18–24 | 7 | 7 | 0 | 0 | 100% |
| Sprint 3 | Oct 25–31 | 2 | 2 | 0 | 0 | 100% |
| Sprint 4 | Nov 1–7 | 4 | 4 | 0 | 0 | 100% |
| Sprint 5 | Nov 8–14 | 4 | 4 | 0 | 0 | 100% |
| Sprint 6 | Nov 15–21 | 7 | 2 | 2 | 3 | 28.6% |
| **Total** | **Oct 11–Nov 21** | **33** | **28** | **2** | **3** | **84.8%** |

**Performance Indicators:**

- **Overall Task Completion:** 84.8% (28 of 33 tasks).
- **Completed Sprints:** Sprints 1–5 achieved 100% completion of their currently recorded tasks.
- **Sprint 6:** Final QA, documentation, and defect resolution are ongoing.
- **Progress Tracking:** GitHub Projects was used to monitor task completion, priorities, and outstanding issues.

**Measurement Method:** Completion rates are calculated from the current task statuses in GitHub Projects. These figures represent the completion of recorded sprint tasks, not a historical baseline of originally planned tasks.

[View Sprint Metrics](https://github.com/users/janaalhazmi/projects/6/views/3)

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
| Sprint 6 | Nov 15–21, 2026 | [Sprint 6 Review & Retrospective](docs/reviews/SPRINT_6_REVIEW.md) |

**Documentation Note:** Sprint 2–6 reviews were compiled retrospectively from project records and GitHub task tracking. They document sprint outcomes and lessons learned without implying that formal retrospective meetings were held on the original sprint dates.

## 7. Task 4 — Final Integration and QA Testing

Stage 4 includes automated frontend/backend tests and manual user acceptance testing across Contractor, Service Provider, and Field Worker roles. End-to-end scenarios exercised the core flow from project creation and GIS work-zone definition through quotations, field assignment, location verification, and project completion.

**The authoritative record for test counts, coverage, scenario-level PASS/FAIL/PARTIAL outcomes, evidence, and open defects is the [QA & Testing Report](docs/testing/QA_Testing_Report.md).** This README deliberately avoids duplicating detailed testing results so that test documentation remains in one maintained location.

The MVP has been deployed for testing, but final QA sign-off depends on resolving or explicitly accepting outstanding findings and completing regression checks. A successful automated test suite alone is not production-readiness approval.

## 8. Task 5 — Deliverables

The following table summarizes the required Stage 4 deliverables, their documentation, and their current status.

| Required Deliverable | Link / Current Location | Status |
|---|---|---|
| **Sprint Planning** | [Sprint 2 Plan](docs/planning/SPRINT_2_PLAN.md) · [GitHub Project Board](https://github.com/users/janaalhazmi/projects/6) | Available. Sprint tasks, assignments, priorities, and progress are tracked through GitHub Projects. |
| **Sprint Reviews** | [Sprint 1](docs/reviews/SPRINT_1_REVIEW.md) · [Sprint 2](docs/reviews/SPRINT_2_REVIEW.md) · [Sprint 3](docs/reviews/SPRINT_3_REVIEW.md) · [Sprint 4](docs/reviews/SPRINT_4_REVIEW.md) · [Sprint 5](docs/reviews/SPRINT_5_REVIEW.md) · [Sprint 6](docs/reviews/SPRINT_6_REVIEW.md) | Documentation available for all six sprints. Sprint 6 reflects the recorded progress snapshot and requires a final update after sprint closure. |
| **Sprint Retrospectives** | [Sprint 1](docs/reviews/SPRINT_1_REVIEW.md) · [Sprint 2](docs/reviews/SPRINT_2_REVIEW.md) · [Sprint 3](docs/reviews/SPRINT_3_REVIEW.md) · [Sprint 4](docs/reviews/SPRINT_4_REVIEW.md) · [Sprint 5](docs/reviews/SPRINT_5_REVIEW.md) · [Sprint 6](docs/reviews/SPRINT_6_REVIEW.md) | Retrospective summaries are included in the sprint review documents. Sprint 2–6 summaries were compiled retrospectively from project records and do not imply that formal retrospective meetings were held. |
| **Source Repository** | [MAMAR Repository — develop Branch](https://github.com/janaalhazmi/MAMAR/tree/develop) | Available. Contains frontend, backend, project documentation, and testing resources. |
| **Bug Tracking** | [GitHub Issues](https://github.com/janaalhazmi/MAMAR/issues) · [GitHub Project Board](https://github.com/users/janaalhazmi/projects/6) | Active. Defects are documented and tracked through GitHub Issues, with outstanding findings requiring resolution or documented acceptance. |
| **Testing Evidence and Results** | [QA & Testing Report](docs/testing/QA_Testing_Report.md) · [Sprint 1 QA Test Cases](docs/testing/QA_TEST_CASES_SPRINT1.md) | Automated testing results and manual UAT findings are documented. Final evidence links, defect verification, and regression results must be confirmed before QA sign-off. |
| **Production Environment** | [MAMAR Live Application](https://mammar-blush.vercel.app/) · [Backend API](https://mamar-api.onrender.com) · [Swagger API Documentation](https://mamar-api.onrender.com/docs) · Database: Supabase (PostgreSQL) | MVP deployed for testing. Final production-readiness approval remains pending QA sign-off. |

### Submission Checklist

Before the final Stage 4 submission, the team must:

- [x] Organize development tasks and sprint tracking through GitHub Projects.
- [x] Document sprint reviews and retrospective summaries for all six sprints.
- [x] Provide access to the source code repository.
- [x] Establish bug tracking through GitHub Issues.
- [x] Document automated testing results and manual UAT findings.
- [ ] Verify that all documentation links are accessible and up to date.
- [ ] Update the Sprint 6 review with its final completion status.
- [ ] Confirm that UAT screenshots and supporting evidence are uploaded and linked in the QA report.
- [ ] Resolve or explicitly accept outstanding defects and document regression testing results.
- [ ] Add the verified deployed application URL.
- [ ] Complete the final QA review and sign-off.

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
│   └── testing/
│       ├── QA_TEST_CASES_SPRINT1.md
│       └── QA_Testing_Report.md
│
├── README.md
└── package-lock.json
```

The following structure reflects the Stage 4 directory on the develop branch, where the latest development work and documentation are maintained.

## 10. Stage 4 Status and Next Steps

As of **November 19, 2026**, MAMAR has an integrated, deployed MVP that supports the main contractor–provider–field-worker workflow. The six-sprint development period runs through **November 21, 2026**. Remaining Stage 4 work includes final regression, review of outstanding UAT findings, completion of evidence links, and final documentation/sign-off.

For the current verified QA status, see the [QA & Testing Report](docs/testing/QA_Testing_Report.md); for task and defect status, see the [GitHub Project](https://github.com/users/janaalhazmi/projects/6) and [Issues](https://github.com/janaalhazmi/MAMAR/issues).
