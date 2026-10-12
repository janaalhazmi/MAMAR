# MAMAR – MVP Development and Execution

## Task 0: Plan and Define Sprints

### 1. Project Overview

MAMAR is a GIS-based B2B platform designed to support temporary traffic control operations for construction and roadwork projects.

The platform connects contractors with traffic control service providers, enabling them to define work zones, submit service requests, receive quotations, coordinate field execution, and document traffic device installations using GIS and GPS-based verification.

Stage 4 focuses on transforming the technical documentation developed in Stage 3 into a functional Minimum Viable Product (MVP).

### 2. Sprint Planning Objectives

The objectives of sprint planning are to:

- Divide MVP development into manageable tasks and iterations.
- Prioritize essential features using the MoSCoW method.
- Assign clear responsibilities to team members.
- Identify dependencies between frontend, backend, and GIS components.
- Establish deadlines and measurable deliverables.
- Monitor development progress and address blockers.
- Ensure that the final MVP follows the approved system architecture.

### 3. Project Timeline

| Item | Details |
|---|---|
| Project | MAMAR |
| Stage | Stage 4 – MVP Development and Execution |
| Start Date | October 11, 2026 |
| End Date | November 21, 2026 |
| Total Duration | 6 weeks |
| Development Approach | Agile |
| Sprint Duration | 1 week |
| Total Sprints | 6 |

### 4. Team Roles and Responsibilities

| Team Member | Role | Responsibilities |
|---|---|---|
| Razan Kashr | Project Manager (PM) & GIS Lead Integration | Manage sprint planning, task assignments, deadlines, progress tracking, team coordination, GIS integration, spatial data configuration, and GIS functionality testing. |
| Jana Alhazmi | Frontend Developer, UI/UX Integration & Source Control Manager (SCM) | Develop React frontend components, integrate UI/UX designs, coordinate Git branching strategies, review pull requests, and ensure proper version control practices. |
| Kayan Alnazari | Frontend Developer & Quality Assurance (QA) | Develop React frontend components, authentication pages, dashboards, and forms; coordinate test cases, document bugs, track fixes, and verify completed features. |
| Shouq Alqarni | Backend Developer | Develop FastAPI endpoints, implement PostgreSQL database models, authentication, business logic, and backend testing. |

### 4.1 Management and Quality Responsibilities

To ensure effective project organization, version control, and quality assurance, the following responsibilities have been assigned:

**Project Manager (PM) – Razan Kashr**
- Coordinate sprint planning and task assignments.
- Monitor deadlines, progress, and task dependencies.
- Identify blockers and coordinate solutions.
- Review sprint deliverables against the MVP scope.

**Source Control Manager (SCM) – Jana Alhazmi**
- Coordinate Git branching and version control practices.
- Ensure development changes are submitted through pull requests.
- Review code changes before merging.
- Maintain repository organization and branch integrity.

**Quality Assurance (QA) – Kayan Alnazari**
- Prepare and coordinate test cases for completed features.
- Test functionality against project requirements.
- Document bugs and track their resolution.
- Verify fixes and confirm that features meet acceptance criteria.

All team members remain responsible for testing their own implementations and participating in code reviews when required.

### 5. MoSCoW Prioritization

The MoSCoW method is used to prioritize features according to their importance to the MVP.

| Priority | Feature | Description |
|---|---|---|
| Must Have | User Registration and Login | Allow users to register and authenticate based on their roles |
| Must Have | Project Creation | Allow contractors to create and manage projects |
| Must Have | GIS Work Zone Definition | Allow contractors to define project areas on an interactive map |
| Must Have | Service Requests | Allow contractors to submit temporary traffic control service requests |
| Must Have | Provider Quotations | Allow providers to submit quotations and estimated durations |
| Must Have | Quote Selection | Allow contractors to review quotations and select a provider |
| Must Have | Assignment Management | Allow providers to assign field workers to projects |
| Must Have | Traffic Device Mapping | Display planned traffic control devices geographically |
| Must Have | GPS-Based Verification | Capture a field worker's location during device installation verification |
| Must Have | GIS Data Integration | Connect the frontend to ArcGIS Online hosted feature layers |
| Should Have | Role-Based Dashboards | Provide appropriate interfaces for contractors, providers, and field workers |
| Should Have | Project Status Tracking | Display project and execution progress |
| Should Have | Verification Documentation | Store verification details and reference supporting field photos |
| Could Have | Advanced Dashboard Analytics | Provide additional project and operational insights |
| Could Have | Automated Notifications | Notify users about requests, quotations, and assignments |
| Won't Have | Online Payments | Payment processing is excluded from the MVP |
| Won't Have | Continuous GPS Tracking | Real-time continuous worker tracking is excluded from the MVP |
| Won't Have | Automated Traffic Control Plan Generation | Engineering plan generation is outside the MVP scope |

### 6. Sprint Breakdown

### Sprint 1: Project Setup and Initial Development

**Duration:** October 11–17, 2026

**Sprint Goal:**
Establish the development environment, configure project
management and version control, deploy the initial system,
and begin MVP implementation.

| Task | Priority | Assigned To |
|---|---|---|
| Set up React frontend and initial UI pages | Must Have | Jana & Kayan |
| Set up FastAPI backend and PostgreSQL database | Must Have | Shouq |
| Configure GitHub repository and branching workflow | Must Have | Jana |
| Set up GitHub Projects and assign development tasks | Must Have | Razan |
| Deploy frontend to Vercel and backend to Render | Must Have | Development Team |
| Verify local execution for all team members | Must Have | All Members |
| Prepare ArcGIS Online layers for frontend integration | Must Have | Razan |
| Begin frontend and backend API integration | Should Have | Kayan & Shouq |
| Review progress and document initial QA results | Must Have | Razan & Kayan |

**Dependencies:**
- Frontend and backend setup must be completed before integration.
- Backend and database configuration must be completed before deployment testing.
- GIS layer verification must be completed before map integration.

**Expected Deliverables:**
- Working frontend, backend, and database environments.
- Initial frontend and backend deployments.
- GitHub Projects board with assigned tasks and deadlines.
- Local execution verified by all team members.
- Initial development progress documented.

#### Sprint 2: Authentication and Project Management

**Duration:** October 18–24, 2026

**Goal:** Implement user authentication and project creation.

| Task | Priority | Assigned To | Deadline |
|---|---|---|---|
| Implement registration and login APIs | Must Have | Shouq | Oct 21 |
| Configure PostgreSQL database models | Must Have | Shouq | Oct 22 |
| Connect frontend authentication forms to FastAPI | Must Have | Kayan | Oct 23 |
| Implement project creation interface | Must Have | Jana | Oct 23 |
| Integrate interactive ArcGIS map | Must Have | Razan & Jana | Oct 24 |
| Test authentication and project creation workflows | Must Have | All Team Members | Oct 24 |

**Expected Deliverables:**
- Working authentication flow.
- PostgreSQL database models.
- Project creation interface.
- Interactive GIS map.
- Initial frontend-backend integration.

#### Sprint 3: GIS Work Zones and Service Requests

**Duration:** October 25–31, 2026

**Goal:** Enable contractors to define work zones and request traffic control services.

| Task | Priority | Assigned To | Deadline |
|---|---|---|---|
| Implement project management APIs | Must Have | Shouq | Oct 27 |
| Implement service request APIs | Must Have | Shouq | Oct 29 |
| Implement work zone polygon drawing | Must Have | Razan & Jana | Oct 29 |
| Connect project polygons to ArcGIS Online | Must Have | Razan | Oct 30 |
| Develop service request interface | Must Have | Kayan | Oct 30 |
| Test project and service request workflows | Must Have | All Team Members | Oct 31 |

**Expected Deliverables:**
- Functional project management.
- GIS work zone creation.
- ArcGIS Online spatial data integration.
- Service request submission.
- Tested contractor workflow.

#### Sprint 4: Quotations and Provider Selection

**Duration:** November 1–7, 2026

**Goal:** Enable providers to submit quotations and contractors to select a provider.

| Task | Priority | Assigned To | Deadline |
|---|---|---|---|
| Implement quotation APIs | Must Have | Shouq | Nov 3 |
| Implement provider quotation interface | Must Have | Jana | Nov 5 |
| Implement quotation review and selection interface | Must Have | Kayan | Nov 5 |
| Implement quote award workflow | Must Have | Shouq | Nov 6 |
| Validate provider and project identifiers | Must Have | Razan & Shouq | Nov 6 |
| Test quotation and provider selection workflow | Must Have | All Team Members | Nov 7 |

**Expected Deliverables:**
- Provider quotation submission.
- Quotation review interface.
- Provider selection workflow.
- Integrated quotation APIs.
- Tested quotation process.

#### Sprint 5: Field Execution and GIS Verification

**Duration:** November 8–14, 2026

**Goal:** Implement field assignments, device mapping, and location-based verification.

| Task | Priority | Assigned To | Deadline |
|---|---|---|---|
| Implement assignment management APIs | Must Have | Shouq | Nov 10 |
| Develop field worker interface | Must Have | Kayan | Nov 11 |
| Implement traffic device mapping | Must Have | Razan & Jana | Nov 12 |
| Integrate Browser Geolocation API | Must Have | Razan & Jana | Nov 12 |
| Implement verification workflow | Must Have | Razan & Jana | Nov 13 |
| Test GIS and GPS verification functionality | Must Have | All Team Members | Nov 14 |

**Expected Deliverables:**
- Field assignment management.
- Traffic device mapping.
- Browser-based GPS location capture.
- Device installation verification workflow.
- Tested GIS verification functionality.

#### Sprint 6: Integration, Testing, and MVP Finalization

**Duration:** November 15–21, 2026

**Goal:** Complete MVP integration, resolve defects, and prepare the final demonstration.

| Task | Priority | Assigned To | Deadline |
|---|---|---|---|
| Complete frontend-backend integration | Must Have | Jana, Kayan & Shouq | Nov 17 |
| Complete GIS integration and spatial validation | Must Have | Razan | Nov 18 |
| Conduct end-to-end workflow testing | Must Have | All Team Members | Nov 19 |
| Fix identified bugs and integration issues | Must Have | All Team Members | Nov 20 |
| Review MVP against Stage 3 documentation | Must Have | Razan | Nov 20 |
| Prepare final MVP demonstration | Must Have | All Team Members | Nov 21 |
| Finalize Stage 4 documentation | Must Have | Razan | Nov 21 |

**Expected Deliverables:**
- Integrated functional MVP.
- Completed GIS workflows.
- Tested core features.
- Resolved critical defects.
- Final MVP demonstration.
- Updated technical documentation.

### 7. Task Dependencies

The following dependencies must be considered during development:

| Task | Dependency |
|---|---|
| Frontend authentication integration | Authentication APIs must be available |
| Project creation workflow | Project APIs and database models must be implemented |
| GIS work zone storage | A project ID must be generated before storing its polygon |
| Service request submission | The associated project must exist |
| Provider quotation submission | The associated service request must exist |
| Provider selection | At least one valid quotation must be available |
| Field worker assignment | The project and provider must be identified |
| Device verification | The traffic device and assigned worker must be identified |
| Final end-to-end testing | Core frontend, backend, and GIS workflows must be integrated |

### 8. Progress Tracking

Development progress will be monitored through GitHub and team communication channels.

The Project Manager will:

- Review task progress throughout each sprint.
- Track completed, ongoing, and blocked tasks.
- Identify dependencies and implementation risks.
- Coordinate between frontend, backend, and GIS development.
- Review sprint deliverables against the planned scope.
- Update priorities when necessary.
- Document important decisions and changes.

Task statuses will be tracked using:

- To Do
- In Progress
- In Review
- Done
- Blocked

### 9. Sprint Reviews and Retrospectives

At the end of each sprint, the team will conduct a sprint review to evaluate completed work.

The review will focus on:

- Features completed during the sprint.
- Features that remain incomplete.
- Technical issues and blockers.
- Integration progress.
- Required improvements for the next sprint.

The team will also conduct a retrospective to identify what worked well, what needs improvement, and how collaboration can be strengthened.

### 10. Definition of Done

A development task will be considered complete when:

1. The required functionality has been implemented.
2. The implementation follows the approved MVP scope.
3. Relevant code has been reviewed.
4. Required testing has been completed.
5. Critical issues have been resolved.
6. The feature works with its required dependencies.
7. Changes have been committed to GitHub.
8. Relevant documentation has been updated.

### 11. Expected Stage 4 Outcome

By November 21, 2026, the MAMAR team aims to deliver a functional MVP demonstrating the core temporary traffic control workflow:

1. User registration and authentication.
2. Contractor project creation.
3. GIS-based work zone definition.
4. Temporary traffic control service request submission.
5. Provider quotation submission.
6. Contractor quotation review and provider selection.
7. Field worker assignment.
8. Traffic device mapping.
9. GPS-based installation verification.
10. Geographic documentation of field activities.

The MVP will demonstrate the integration of React, FastAPI, PostgreSQL, and ArcGIS Online while maintaining the scope established during Stage 3.

---

**Project:** MAMAR  
**Stage:** Stage 4 – MVP Development and Execution  
**Task:** 0 – Plan and Define Sprints  
**Project Manager:** Razan Kashr  
**Development Period:** October 11 – November 21, 2026
