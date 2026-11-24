# MAMAR — Final Project Closure Report

**Project:** MAMAR — Temporary Traffic Control Management Platform  
**Stage:** Stage 5 — Project Closure  
**Project Team:** Razan Kashr, Kayan Alnazari, Shouq Alqarni, Jana Alhazmi  
**Status:** In Progress

---

# 1. Project Results & Objectives Evaluation

## 1.1 Project Overview

MAMAR is a GIS-based B2B platform designed to streamline temporary traffic control operations by connecting contractors with traffic control service providers.

The platform centralizes project management, geographic work-zone mapping, service requests, quotations, provider selection, field execution documentation, and project monitoring within an integrated digital workflow.

The Minimum Viable Product (MVP) was developed through an Agile approach, with functionality evaluated using automated testing, manual User Acceptance Testing (UAT), and production deployment verification.

## 1.2 Initial Objectives vs. Final Outcomes

The project's achievements were evaluated against the SMART objectives established in the Stage 2 Project Charter.

| Initial Objective | Final Outcome | Status |
|---|---|---|
| Develop and integrate six core MVP features: user authentication, project creation, work-zone mapping, service requests, provider selection, and project status tracking. | All six core capabilities were implemented and validated through documented MVP testing activities. | Achieved |
| Implement a field documentation workflow allowing providers to record site information, attach photos, and update implementation status. | Field execution updates, site photo uploads, and completion documentation were implemented and verified. | Achieved |
| Complete and test an integrated end-to-end workflow covering the project's main operational stages. | The critical workflow was validated across Contractor, Service Provider, and Field Worker roles, from project creation through completion review. | Achieved |

The documented QA results demonstrate that the three primary SMART objectives were achieved within the tested MVP scope.

## 1.3 MVP Features Delivered

The final MAMAR MVP includes the following capabilities:

### User Authentication and Role-Based Access

Supports designated workflows for Contractors, Service Providers, and Field Workers.

### Project Creation and Management

Enables contractors to create projects, manage project information, and track project status.

### GIS Work-Zone Mapping

Allows users to define geographic work zones and manage project locations through integrated mapping functionality.

### Service Requests and Quotations

Enables contractors to request temporary traffic control services and service providers to submit quotations.

### Provider Selection and Assignment

Supports quotation review, provider selection, and field worker assignment.

### Field Execution and Documentation

Enables field workers to verify their location, update execution activities, and upload photographic site evidence.

### Project Monitoring and Completion

Supports project progress tracking, completion submissions, and contractor review of completed work.

### Additional MVP Integration

A payment workflow was implemented and evaluated using PayPal Sandbox. This functionality was validated in a test environment and does not represent live financial transaction processing.

## 1.4 Quality Assurance and Testing Results

The MAMAR MVP underwent automated testing, integration validation, manual UAT, and production verification.

### Automated Testing Results

| Testing Category | Result |
|---|---|
| Frontend Unit and Component Tests | 806 Passed |
| Backend Unit Tests | 15 Passed |
| Backend Integration Tests | 240 Passed |
| Total Automated Tests Passed | 1,061 |
| Reported Test Failures | 0 |
| Frontend Statement Coverage | 91.37% |
| Backend Statement Coverage | 93% |

**Testing Notes:**

- The total of 1,061 represents the latest separately documented frontend and backend test executions.
- Frontend coverage of 91.37% was measured during an earlier execution containing 807 passing tests, rather than the subsequent 806-test execution.
- Backend automated tests used an isolated PostgreSQL test database.
- These results do not establish that both automated suites were rerun together against the final production release.

### Manual User Acceptance Testing

Manual UAT evaluated the primary business workflows across three operational roles:

- Contractor
- Service Provider
- Field Worker

The documented testing covered:

- Project creation and GIS work-zone configuration.
- Service request submission and quotation management.
- Provider selection and payment sandbox interactions.
- Field worker assignment and location verification.
- Field execution updates and site photo documentation.
- Project monitoring and completion review.

The final QA report recorded successful verification of the critical MVP workflow.

### Defect Resolution

During final testing, the team identified and resolved defects involving:

1. Navigation following quotation submission.
2. Site photo upload and visibility.
3. Service provider information displayed during completion review.

These defects were documented through GitHub Issues, corrected, and verified through subsequent testing.

**Final QA Assessment: PASS — MVP Critical Workflows Validated.**

## 1.5 Deployment and Project Achievements

The MAMAR MVP was deployed using the following infrastructure:

| Component | Technology |
|---|---|
| Frontend | React — Vercel |
| Backend | FastAPI — Render |
| Database | PostgreSQL — Supabase |
| GIS Integration | ArcGIS-based Mapping |
| Version Control | GitHub |
| Automated Testing | Vitest and Pytest |

Production verification confirmed that the deployed application was accessible and that its critical workflows operated as expected during documented testing.

### Key Achievements

1. Delivered the six core MVP features established in the Project Charter.
2. Implemented the additional field documentation workflow.
3. Integrated GIS capabilities into temporary traffic control management.
4. Connected the primary operational roles through a centralized digital workflow.
5. Completed documented automated and manual testing activities.
6. Resolved identified critical workflow defects.
7. Successfully deployed and verified the MVP.

## 1.6 Overall Project Evaluation

Based on the documented implementation and QA results, MAMAR achieved its three primary SMART objectives.

The MVP demonstrates how GIS technology can support the coordination, monitoring, and documentation of temporary traffic control operations.

The project also demonstrates the successful integration of frontend development, backend services, database management, and geospatial functionality.

The final QA assessment confirmed readiness for academic delivery within the tested MVP scope.

Further performance, security, scalability, and broader real-world validation are recommended before commercial production deployment.

---

# 2. Technical Results & Lessons Learned

## 2.1 Backend and Integration — Shouq Alqarni

*This part is written in first person by Shouq Alqarni, the backend owner. The architecture, the diagrams and the full API map are in [Technical Architecture](Technical%20Architecture/README.md) (Issue #88).*

### Summary

I built the FastAPI backend that every MAMAR screen uses. I also connected it to the database, the frontend and nine external services. The final backend is much larger than the Stage 3 plan, and every part of it is covered by automated tests.

| Measure | Stage 3 plan | Final MVP |
|---|---:|---:|
| REST endpoints | 12 | 86 |
| API routers | 5 | 17 |
| Database tables | 6 | 16 |
| Backend tests | — | 255 (15 unit, 240 integration) |
| Backend statement coverage | — | 93% |

### What I delivered

| Area | Result |
|---|---|
| Security | JWT tokens that expire after 60 minutes; Argon2 password hashing; role and project checks on every protected route; login lockout after 10 failed attempts in 15 minutes; Cloudflare Turnstile on registration and login; an email passcode before an account is created |
| Field checks | Check-in only within 300 m of the site. Device verification only within 50 m of the planned point. Each verification is saved and shown to the contractor and the provider. |
| Site photos | JPEG, PNG or WebP, up to 5 MB each and 10 per upload, tagged as before, during or after the work |
| Integrations | ArcGIS feature layer for planned device points, TomTom traffic, Twilio WhatsApp, EmailJS, PayPal Sandbox and Anthropic Claude for the smart features. Open-Meteo weather is loaded in the browser. |
| Testing | 255 backend tests on a real PostgreSQL database, run by GitHub Actions on every pull request |
| Deployment | Render for the backend and Vercel for the frontend, both deploying from `develop`. UptimeRobot watches `/health`. |

### Technical challenges and how I solved them

| Challenge | Cause | Solution | Evidence |
|---|---|---|---|
| A Render deploy failed | A database deadlock happened while `ALTER TABLE users ADD COLUMN ...` ran at start-up, while the running instance was still using the table. | I ran a manual redeploy of the same commit, and it succeeded. All schema changes use `ADD COLUMN IF NOT EXISTS`, so running them again is always safe. | Render deploy log |
| The weather card said "service could not be reached" | Open-Meteo refused requests from Render's shared servers. It worked locally but not in production. | The backend now returns only the project location. The browser loads the weather directly, and the card shows one clear "today" view. | PR #70, PR #71 |
| Smart-feature answers sometimes broke the page | The model sometimes added text around its JSON, so parsing failed. | I switched to a forced tool call, so the answer always returns as structured data. Answers are cached in `ai_results`, and each user is limited to 40 requests per hour. | `core/ai.py` |
| Device verification was lost after a refresh | The endpoint checked the distance but did not save the result. | I added the `project_devices` table. Each verification now saves its time, position and distance, and notifies the contractor. | PR #75 |
| Paying took the user to the wrong project | After PayPal returned to the site, the app did not know which project had been paid. | The payment page keeps the project id and opens that project after the capture. | PR #75 |
| Site photos were not saved | Photos were sent only when the worker pressed a later button, so leaving the page lost them. | Photos now upload as soon as they are chosen. A failed upload shows a "Try again" button, and the page warns before closing with unsent photos. | Issue #79, PR #81 |
| Tests passed locally but failed in CI | CI used Python 3.13 and Render used Python 3.14. A missing import only failed on 3.13. | I fixed the import in `schemas/workflow.py`. | PR #81 |
| Merge conflicts at the end of Stage 4 | Several of us edited the same pages in the same week. At one point 24 frontend tests failed on `develop`. | I kept my teammates' fixes where they overlapped with mine, and I fixed the failing tests before the merge. | PR #81 |
| The uptime monitor reported the site as down | UptimeRobot sends `HEAD` requests, and `/health` answered only `GET`, so it returned 405. | `/health` now answers both `GET` and `HEAD`. | `routers/health.py` |

### Lessons learned

1. **Production is a different environment.** IP blocking, a different Python version and a locked table all failed only on Render. I now check the deploy log and the live site after every merge.
2. **Every external service needs a fallback.** Nine services are connected, and a failure in one of them affects only its own feature. The project workflow keeps working.
3. **Tests need a real database.** Running the integration tests on PostgreSQL found problems that mocks would have hidden, such as the difference between a new database and an upgraded one.
4. **Important state belongs on the server.** Device verification, the paid project and the provider name on the completion page all broke while they depended on the browser. Saving them in the backend fixed them on every device.
5. **Small pull requests merge more easily.** The large end-of-stage pull requests had the conflicts. The small, focused ones merged without problems.

### What I would do differently

| Improvement | Why | Priority |
|---|---|---|
| Use Alembic migrations as a separate pre-deploy step | Schema changes would no longer run while the app starts, which caused the deadlock | High |
| Use the same Python version in CI, Render and local development | The 3.13 / 3.14 difference hid an error in production | High |
| Add end-to-end tests for the contractor, provider and field worker workflow | Most late bugs crossed two roles and were found only in manual testing | High |
| Store photos in object storage, for example Supabase Storage | The database would stay small and backups would be faster | Medium |
| Agree on the API contract with the frontend before building each feature | Both sides could work in parallel with fewer late changes | Medium |

---

# 3. Team Retrospective Highlights

# Individual Retrospective – Kayan Alnazari
**Project:** MAMAR – Temporary Traffic Control Management Platform  
**Stage:** Stage 5 – Project Closure  
**Team Member:** Kayan Alnazari  
**Role:** Frontend Developer

### 1. My Contributions and Achievements
During the MAMAR project, I was responsible for developing and improving several frontend features using React.

My main contributions included:
- Developing and improving the Provider Dashboard, Prepare Quotation, Provider Projects, and Field Worker interfaces.
- Connecting frontend components with backend APIs to support project and quotation workflows.
- Improving UI layouts, page consistency, and navigation between different sections.
- Fixing issues related to quotation submission, provider project tracking, and page navigation.
- Writing and organizing automated frontend tests using Vitest and React Testing Library.
- Testing user interactions, validating form inputs, and fixing bugs to improve application reliability.
- Collaborating with team members through GitHub, code reviews, and regular discussions.

These contributions helped improve the functionality, usability, and overall quality of the MAMAR MVP.

### 2. Challenges I Faced
One of my biggest challenges was balancing my university responsibilities with the intensive schedule of the academy. Managing university assignments, exams, project deadlines, and academy tasks at the same time required strong time management and organization.

From a technical perspective, integrating frontend features with backend APIs was challenging, especially when some workflows depended on other team members' implementations.

I also faced Git merge conflicts, navigation issues, and difficulties testing workflows that involved multiple user roles.

Despite these challenges, I worked on prioritizing tasks, communicating with my teammates, and solving problems step by step.

### 3. Lessons Learned
Throughout this project, I gained valuable technical and personal skills.

I improved my knowledge of React, API integration, debugging, automated testing, and GitHub collaboration.

I learned the importance of writing tests early, maintaining clean and organized code, and ensuring consistent UI design across different pages.

I also learned that clear communication and teamwork are essential when developing a project with multiple interconnected components.

Most importantly, balancing university and academy responsibilities taught me how to manage my time, work under pressure, and stay committed to deadlines.

### 4. Future Improvements
For future projects, I would focus on:

- Starting frontend and backend integration earlier to identify issues before final testing.
- Writing automated tests throughout development instead of leaving them until later stages.
- Creating more reusable components to improve code organization and consistency.
- Improving task planning and time management to balance academic and project responsibilities.
- Allocating more time for debugging, user testing, and UI improvements.
- Strengthening communication between team members to reduce integration delays.

### 5. Overall Reflection
Working on MAMAR was a valuable experience that helped me grow as a frontend developer and team member.

Although balancing university and academy responsibilities was challenging, the project gave me practical experience in building a real-world application, solving technical problems, and collaborating with a development team.

I am proud of my contributions to MAMAR and the skills I developed throughout the project.


*Pending the team retrospective meeting and documented feedback — Issue #85.*

---

# 4. Future Recommendations

*To be finalized after reviewing the team's lessons learned and retrospective findings.*

---

# 5. Supporting Documentation

- **Project Charter:** Stage 2 — Project Charter Development.
- **Technical Documentation:** Stage 3 — Technical Documentation.
- **QA Testing Report:** Stage 4 — Quality Assurance & Testing Report.
- **Manual UAT Evidence:** Stage 4 — Testing Evidence.
- **Issue Tracking:** MAMAR GitHub Issues.
- **Project Management:** MAMAR GitHub Project Board.

---

**Report Status:** Draft — Pending Team Contributions and Final Review.
