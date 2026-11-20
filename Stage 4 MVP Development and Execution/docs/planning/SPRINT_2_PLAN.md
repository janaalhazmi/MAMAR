# MAMAR – Sprint 2 Plan

## 1. Sprint Overview

| Item | Details |
|---|---|
| Project | MAMAR – Temporary Traffic Control Management Platform |
| Stage | Stage 4: MVP Development and Execution |
| Sprint | Sprint 2 |
| Sprint Period | October 18–24, 2026 |
| Sprint Duration | 1 Week |
| Project Management Tool | GitHub Projects |
| Version Control | GitHub |
| Development Approach | Agile / Scrum-Inspired Workflow |

### Team Members and Responsibilities

| Team Member | Role |
|---|---|
| Jana Alhazmi | Frontend Developer & UI/UX Integration |
| Razan Kashr | Project Manager & GIS Lead Integration |
| Kayan Alnazari | Frontend Development & QA |
| Shouq Alqarni | Backend Development |

## 2. Sprint Goal

Complete and verify the authentication workflow and home page functionality across MAMAR's frontend, FastAPI backend, and PostgreSQL database.

The sprint focuses on delivering functional, integrated features that can be demonstrated during Meeting 7.

## 3. Sprint Backlog

| Task | Responsible Team Members | Priority |
|---|---|---|
| Complete Authentication Frontend Integration | Jana Alhazmi, Kayan Alnazari | Must Have |
| Finalize Authentication API and Database Integration | Shouq Alqarni | Must Have |
| Implement Logout and Session Management | Jana Alhazmi, Shouq Alqarni | Must Have |
| Complete Home Page End-to-End Integration | Jana Alhazmi, Kayan Alnazari, Shouq Alqarni | Must Have |
| Resolve Frontend–Backend Connection Issues | Jana Alhazmi, Shouq Alqarni | Must Have |
| Execute Authentication and Home Page QA Tests | Razan Kashr, Kayan Alnazari | Must Have |
| Review Sprint 2 Progress and Prepare Meeting 7 Evidence | Razan Kashr | Must Have |

All tasks are tracked through GitHub Issues and GitHub Projects.

## 4. Sprint Deliverables

By the end of Sprint 2, the team aims to deliver:

1. A functional user registration process.
2. A functional login process.
3. A working logout process.
4. Authentication integrated with the FastAPI backend and PostgreSQL database.
5. A completed and functional home page.
6. Successful communication between the frontend and backend.
7. Documented QA results and testing evidence.

## 5. Meeting 7 Requirements

The team will demonstrate the following functionality:

### Authentication

- User registration (Sign Up).
- User login.
- User logout.
- Frontend integration with backend authentication APIs.
- Database integration for user account management.
- Appropriate handling of authentication errors.

### Home Page

- Completed home page interface.
- Functional navigation.
- Backend integration where required.
- Successful deployment and accessibility.

## 6. Development Workflow

The team follows the GitHub branching workflow:

1. Create or use a feature branch for development.
2. Implement the assigned functionality.
3. Test the changes locally.
4. Create a Pull Request targeting `develop`.
5. Review and test the Pull Request.
6. Merge approved changes into `develop`.
7. Verify integrated functionality.
8. Merge stable, tested changes into `main` when ready for release.

## 7. QA and Testing Plan

QA testing will focus on the following scenarios:

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| TC-AUTH-01 | Register with valid information | Account created successfully |
| TC-AUTH-02 | Register with an existing email | Appropriate error message displayed |
| TC-AUTH-03 | Login with valid credentials | Login succeeds and user is redirected |
| TC-AUTH-04 | Login with invalid credentials | Appropriate error message displayed |
| TC-AUTH-05 | Logout from an authenticated session | Session ends and user is redirected |
| TC-AUTH-06 | Access a protected page after logout | Access is denied or user is redirected |
| TC-AUTH-07 | Login using supported user roles | Correct role-based navigation |
| TC-HOME-01 | Open the home page | Page loads successfully |
| TC-HOME-02 | Navigate between main pages | Navigation works correctly |
| TC-HOME-03 | Verify required API communication | Requests complete successfully |
| TC-HOME-04 | Test home page on different screen sizes | Layout remains usable |

Test results will be recorded as Passed, Failed, or Blocked, with supporting evidence where available.

## 8. Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Frontend–backend connection errors | Authentication or page functionality may fail | Verify API configuration, CORS, and deployment settings |
| Backend changes are not merged into `develop` | Integrated functionality may be incomplete | Review and merge backend Pull Requests before final QA |
| Authentication errors | Users may be unable to access the platform | Test valid and invalid authentication scenarios |
| Delays in integration | Meeting 7 deliverables may be incomplete | Prioritize authentication and home page functionality |
| Insufficient testing | Defects may remain undetected | Perform end-to-end QA and document results |

## 9. Definition of Done

A Sprint 2 task is considered complete when:

- The required functionality is implemented.
- Relevant tests pass.
- No critical blocking defects remain.
- The code has been reviewed.
- The changes have been merged into the appropriate branch.
- QA verification is completed where applicable.
- The GitHub Issue is updated with the final result.

## 10. Sprint Review

At the end of Sprint 2, the team will:

- Demonstrate completed authentication functionality.
- Demonstrate the completed home page.
- Review GitHub Issues and Pull Requests.
- Present QA results.
- Identify incomplete work and remaining defects.
- Document achievements and improvements for Sprint 3.

---

## 11. Conclusion

Sprint 2 focuses on completing the integration of MAMAR's authentication functionality and home page.

The planned activities will strengthen communication between the React frontend, FastAPI backend, and PostgreSQL database.

The team will prioritize completing the requirements for Meeting 7, resolving integration issues, and verifying the implemented functionality through end-to-end QA testing.

The results of Sprint 2 will be documented in the Sprint 2 Review and Retrospective report to support planning and improvements for Sprint 3.

---

**Prepared by:** Project Manager and QA  
**Project:** MAMAR  
**Planning Date:** October 20, 2026
