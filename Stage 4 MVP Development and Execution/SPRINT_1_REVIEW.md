# MAMAR – Sprint 1 Review and Retrospective

## 1. Sprint Overview

| Item | Details |
|---|---|
| Project | MAMAR – Temporary Traffic Control Management Platform |
| Stage | Stage 4: MVP Development and Execution |
| Sprint | Sprint 1 |
| Sprint Period | October 11–17, 2026 |
| Review Date | October 19, 2026 |
| Sprint Duration | 1 Week |
| Project Management Tool | GitHub Projects |
| Version Control | GitHub |
| Development Approach | Agile / Scrum-Inspired Workflow |

### Team Members and Responsibilities

| Team Member | Role |
|---|---|
| Razan | Project Manager, GIS Lead, and QA |
| Jana Alhazmi | Frontend Developer and Source Control Management |
| Kayan Alnazari | Frontend Developer and QA |
| Shouq Alqarni | Backend Developer |

## 2. Sprint Objectives

The main objective of Sprint 1 was to establish the technical foundation of the MAMAR MVP and prepare the development environment for subsequent sprints.

The planned objectives included:

1. Set up the React frontend and initial user interface.
2. Establish the FastAPI backend and PostgreSQL database structure.
3. Configure the GitHub repository and branching workflow.
4. Create and organize development tasks in GitHub Projects.
5. Prepare ArcGIS Online layers for frontend integration.
6. Deploy the frontend to Vercel and the backend to Render.
7. Verify local execution across the development team.
8. Begin frontend and backend API integration.
9. Conduct an initial QA review and document findings.

## 3. Sprint 1 Deliverables

### 3.1 Frontend Development

The frontend team established the initial React application using Vite.

The initial implementation includes:

- Application routing and page structure.
- Landing page.
- Registration and login interfaces.
- Contractor dashboard.
- Provider dashboard.
- Project location interface.
- Initial ArcGIS map integration.
- Service selection interface.

The frontend implementation was reviewed through the GitHub pull request workflow.

The initial frontend pull request was approved and merged into the `develop` branch.

The frontend was also deployed to Vercel.

**Current status:** Initial frontend setup completed. Functional improvements and backend integration remain in progress.

### 3.2 Backend Development

The backend team prepared the initial FastAPI application and PostgreSQL database integration using SQLAlchemy.

The implementation includes:

- Six database models based on the approved Stage 3 design.
- User registration endpoint.
- User login endpoint.
- JWT-based authentication.
- Password hashing.
- Health check endpoint.
- CORS configuration.
- Automated test files.
- Render deployment documentation.

The backend implementation was reviewed, and technical findings were communicated to the developer.

The findings include:

- Dependency configuration verification.
- Administrative account registration restrictions.
- Provider and worker account authorization.
- Frontend and backend registration compatibility.
- Automated test execution and verification.
- Deployment and database connectivity verification.

**Current status:** Initial implementation prepared. Final verification, required corrections, and integration remain pending.

### 3.3 GIS Preparation

The GIS work focused on preparing the ArcGIS Online data structure required for MAMAR.

The planned GIS layers include:

| Layer | Geometry Type | Purpose |
|---|---|---|
| MAMAR_Providers | Point | Service provider locations |
| MAMAR_Projects | Polygon | Project and work-zone boundaries |
| MAMAR_Detours | Polyline | Temporary detour routes |
| MAMAR_Traffic_Devices | Point | Traffic control devices |
| MAMAR_Verifications | Point | Geographic field verification |

The frontend includes an initial map interface.

During QA review, it was identified that the current project location workflow uses point selection, while the planned project area workflow requires polygon geometry.

**Current status:** Initial GIS preparation completed. Polygon drawing and integration with the project workflow remain pending.

### 3.4 Project Management and Source Control

GitHub Projects was configured to organize tasks, assign responsibilities, track priorities, and monitor sprint progress.

The project workflow contains seven statuses:

| Status | Description |
|---|---|
| Todo | Task has not started yet. |
| In Progress | Development work is currently in progress. |
| In Review | Development is complete and the code is ready for review. |
| Merged | Code has been reviewed, approved, and merged into the `develop` branch. |
| QA | The merged changes are being tested to verify functionality, navigation, links, and expected behavior. |
| Done | The task has passed code review and QA testing and is fully completed. |
| Blocked | The task cannot proceed due to an identified issue or dependency. |

The project also uses:

- Sprint iterations.
- Task assignees.
- Priority levels.
- Due dates.
- GitHub Issues.
- Pull Requests.
- Feature branches.
- The `develop` integration branch.

### 3.5 Sprint 1 Progress Tracking

The following figures represent the GitHub Projects board status recorded during the review on October 19, 2026.

| Status | Number of Tasks |
|---|---:|
| Todo | 1 |
| In Progress | 3 |
| In Review | 0 |
| Merged | 0 |
| QA | 0 |
| Done | 5 |
| Blocked | 0 |
| **Total** | **9** |

Five of the nine tracked tasks were marked as Done, representing approximately 56% of the Sprint 1 task count.

This percentage reflects the recorded board statuses at the time of review. It does not represent the percentage of the entire MVP completed.

Some tasks marked Done may still require additional verification as part of the broader integration and QA process.

## 4. Quality Assurance Review

### 4.1 Review Scope

An initial technical review was conducted on the frontend and backend project files.

The review focused on:

- Application routing.
- Registration and login workflows.
- Backend authentication and authorization.
- API compatibility.
- Database structure.
- GIS map functionality.
- Deployment configuration.
- Automated testing.
- Project documentation.

### 4.2 Frontend Findings

The review identified the following items requiring attention:

1. Inconsistent routes between project creation pages.
2. Navigation links pointing to undefined routes.
3. Registration and login relying on browser local storage rather than backend authentication.
4. Differences between frontend registration fields and backend API requirements.
5. Point-based project location selection instead of polygon-based work-zone definition.
6. Location search functionality requiring implementation.
7. Static map content in the service selection workflow.
8. Hardcoded dashboard and user data.
9. Unused map-related code requiring cleanup.

### 4.3 Backend Findings

The review identified the following items requiring attention:

1. Verification of the HTTP client dependency configuration.
2. Prevention of unauthorized administrative account registration.
3. Validation of provider and worker affiliation.
4. Verification of CORS settings for the deployed frontend.
5. Execution and documentation of automated tests.
6. Verification of the deployed backend and PostgreSQL connection.

### 4.4 QA Status

The initial code review was completed, and the findings were communicated to the responsible team members.

However, the following activities remain pending:

- Verification of corrected code.
- Confirmation of automated test results.
- Frontend and backend integration testing.
- Authentication and authorization testing.
- End-to-end project creation testing.
- GIS polygon workflow testing.
- Deployment connectivity testing.

No unexecuted tests are reported as passed.

## 5. Challenges and Deviations

### 5.1 Frontend and Backend Integration

The frontend and backend were developed in parallel.

Differences between frontend registration fields and backend API requirements were identified during review.

**Action:** Coordinate API contracts and complete integration during the next development cycle.

### 5.2 Application Navigation

Some application routes are not consistently defined.

**Action:** Correct route mismatches and verify the project creation workflow.

### 5.3 GIS Workflow

The initial map interface supports location selection, but the project requires polygon-based work-zone definition.

**Action:** Implement polygon drawing and coordinate GIS data integration.

### 5.4 Security and Authentication

The review identified authorization requirements that must be addressed before the authentication functionality can be approved.

**Action:** Apply backend security corrections and replace temporary frontend authentication.

### 5.5 Testing and Verification

Some features have been implemented or documented but have not yet been fully verified through execution and integration testing.

**Action:** Run automated tests, document results, and perform QA after corrections.

### 5.6 Repository Organization

The review identified inconsistent naming of the Stage 4 directory between development branches.

**Action:** Standardize the directory structure before merging backend changes.

## 6. Sprint Review Outcome

Sprint 1 established the initial technical and organizational foundation of the MAMAR MVP.

The team prepared the frontend structure, backend foundation, GIS data structure, repository workflow, and project tracking system.

The initial code review also identified improvements required before the next integration milestone.

The team received documented technical feedback and began working on the required corrections.

**Sprint 1 outcome:** Partially completed, with outstanding development, integration, and QA activities to be continued in subsequent sprints.

## 7. Sprint Retrospective

### 7.1 What Went Well

- Team responsibilities were assigned.
- GitHub Projects was established for task tracking.
- The initial frontend application was implemented.
- The frontend deployment was established.
- The initial backend architecture was prepared.
- GIS requirements were identified and organized.
- Code review helped identify technical issues early.

### 7.2 What Could Be Improved

- Define frontend and backend API contracts earlier.
- Validate navigation routes before marking frontend tasks complete.
- Strengthen authentication and authorization review.
- Improve coordination between GIS requirements and frontend implementation.
- Record automated and manual test evidence consistently.
- Standardize repository paths and documentation.

### 7.3 Action Items for Sprint 2

| Action Item | Responsible |
|---|---|
| Fix project creation navigation and undefined routes | Jana / Kayan |
| Align registration and login with backend API | Jana / Kayan / Shouq |
| Resolve backend security and dependency findings | Shouq |
| Verify backend tests and Render deployment | Shouq |
| Implement or plan polygon-based project area selection | Jana / Kayan / Razan |
| Update frontend and integration QA test cases | Kayan / Razan |
| Standardize Stage 4 directory naming and GitHub documentation | Jana |
| Review pull requests and verify corrections | Razan / Jana |
| Track outstanding Sprint 1 work and plan Sprint 2 | Razan |

## 8. Next Steps

The team will continue development in Sprint 2, scheduled for October 18–24, 2026.

The immediate priorities are:

1. Resolve the technical findings communicated during the Sprint 1 review.
2. Verify backend authentication, database connectivity, and deployment.
3. Begin functional integration between the frontend and backend.
4. Correct broken navigation routes.
5. Prepare GIS polygon functionality for the project workflow.
6. Expand QA test coverage and record actual test results.
7. Review and merge approved changes through GitHub pull requests.
8. Update GitHub Projects based on verified task progress.

## 9. Conclusion

Sprint 1 provided the initial foundation for MAMAR development.

Although several planned tasks remain incomplete or require additional verification, the team established the main project structure and identified technical priorities for the next sprint.

The documented findings and retrospective actions will guide Sprint 2 development, integration, and quality assurance.

---

**Prepared by:** Project Manager and QA  
**Project:** MAMAR  
**Review Date:** October 19, 2026
