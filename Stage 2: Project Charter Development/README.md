# MAMAR | Temporary Traffic Control Management Platform🚧

## 0. Project Objectives

### Purpose

The purpose of MAMAR is to provide a centralized GIS-based B2B platform that connects contractors with traffic control service providers and simplifies the management, coordination, and documentation of temporary traffic control operations for construction and roadwork projects.

### SMART Objectives

1. Develop the MAMAR MVP with core features including user authentication, project creation, work zone mapping, service requests, provider selection, and project status tracking by the end of the MVP development stage.
2. Implement location-based field documentation that allows traffic control providers to record implemented traffic control elements and attach site information and photos before the end of the MVP development stage.
3. Complete and demonstrate the functional MVP through testing and bug fixing, ensuring that the main user workflow from project creation to field documentation can be successfully completed before the final project presentation.

### SMART Team Goals

| | Goals | S How is it specific? | M How is measurable? | A How is it attainable? | R How is it relevant? | T How is it time-based? |
|---|---|---|---|---|---|---|
| | To develop a functional MVP of MAMAR, a B2B platform that connects contractors with traffic control service providers, enabling them to manage projects, define work zones, request and coordinate traffic control services, and document field implementation through an integrated digital workflow with geospatial capabilities. | Develop an MVP of MAMAR that connects contractors with traffic control service providers and allows users to create projects, define work zones, request services, select providers, and track project status. | Complete the core features, including user authentication, project creation, interactive mapping, service requests, provider selection, project status tracking, and field documentation. | Divide the development tasks among the team members based on their roles in frontend, backend, database and API integration, and GIS and geospatial integration. | MAMAR addresses the need for a centralized platform to organize and document temporary traffic control operations for construction and roadwork projects. | Complete and demonstrate the MVP by the end of the project development period, with regular weekly progress reviews to ensure all planned features are completed on time. |

## 1. Stakeholders and Team Roles

### Team Roles

| Team Member | Role | Responsibilities |
|---|---|---|
| Kayan Alnazari | Frontend Developer | Develop the user interface, dashboards, responsive frontend components, and connect frontend features with the application services. |
| Jana Alhazmi | Database & API Integration | Design and manage the application database and support data exchange between the frontend, backend APIs, and system components. |
| Shouq Alqarni | Backend Developer | Develop backend services, authentication, business logic, and APIs. |
| Razan Kashr | Project Manager & GIS Integration Lead | Coordinate project planning, task distribution, and team progress, while leading GIS data preparation and the integration of mapping and geospatial functionality into the platform. |
| All team members | Development Team | Collaborate on planning, integration, testing, documentation, debugging, and project delivery. |

### Stakeholders

| Stakeholder | Type | Involvement |
|---|---|---|
| Kayan Alnazari | Internal | Frontend Development |
| Shouq Alqarni | Internal | Backend Development |
| Razan Kashr | Internal | Project Management & GIS Integration |
| Jana Alhazmi | Internal | Database & API Integration |
| Instructors / Tutors | Internal | Project guidance, feedback, and evaluation. |
| Contractors | External | Potential users who request traffic control services. |
| Traffic Control Service Providers | External | Potential users who manage traffic control service requests, coordinate field implementation, and document completed work through their field teams. |
| Platform Administrators | External | Potential users who manage user accounts, monitor platform activities, and oversee system-level operations. |

## 2. Define Scope

### In-Scope:

- Users log in with defined roles such as Contractor, Traffic Control Company, and Platform Administrator.
- The contractor creates a project, defines the work zone on the map, uploads the approved traffic plan, and submits a service request.
- Traffic control companies can view relevant service requests, provide quotations, and the contractor can select a provider.
- Traffic control elements such as signs and barriers can be represented on the map, while the Traffic Control Service Provider documents field implementation by attaching site information and photos and updating the completion status.
- The project dashboard shows implementation progress, mapped traffic control elements, supporting field documentation, and project status records.

### Out-of-Scope:

- A separate mobile application. The MVP will be developed as a responsive web-based platform.
- Real online payments through a payment gateway.
- Designing or approving traffic plans inside the platform. The company uploads a plan that's already approved.
- Connecting to government systems or live traffic data.
- Covering cities outside Riyadh for now.

## 3. Identify Risks and Mitigation Plans

| Risk | Mitigation |
|---|---|
| Limited development time may affect completion of planned MVP features | Prioritize core MVP features, divide work into weekly goals, and review progress regularly. |
| Scope expansion during development | Keep the agreed MVP scope fixed and move non-essential ideas to future enhancements unless they are required for the core workflow. |
| Some tools or technologies are new to the team | Build small prototypes and test unfamiliar technologies early before integrating them into the full system. |
| GIS and web integration may introduce technical complexity | Test mapping and spatial-data integration early with small prototypes, then integrate it progressively with the main application. |
| Limited availability of accurate real-world traffic control and service-provider data | Use structured sample datasets for the MVP while designing the data model so real data can be supported in future development. |
| Integration issues between frontend, backend, database, APIs, and GIS components | Integrate and test system components progressively throughout development instead of waiting until the final stage. |

## 4. Develop a High-Level Plan

| Stage | Timeline | Key Deliverables |
|---|---|---|
| Stage 1: Idea Development – Completed | Weeks 1–2 | Team formation, brainstorming, idea selection, problem identification, and development of the MAMAR platform concept. |
| Stage 2: Project Charter Development – Current | Weeks 3–4 | Define project objectives, team roles, stakeholders, project scope, risks and mitigation plans, started to prepared the geospatial data and layers and the high-level project plan. |
| Stage 3: Technical Documentation | Weeks 5–6 | Prepare system requirements, system architecture, database design, API structure, GIS requirements, user flows, and UI/UX documentation. |
| Stage 4: MVP Development | Weeks 7–10 | Develop the MAMAR MVP including user authentication, project creation, work zone mapping, service requests, provider selection, field documentation, dashboards, system integration between frontend, backend, database, APIs, and GIS components. |
| Stage 5: Project Closure | Weeks 11–12 | Final testing and bug fixing, complete project documentation, prepare the final presentation and demo, and deliver the final MVP. |

### Key Milestones

- Idea approved and team formed – End of Week 2
- Project Charter completed – End of Week 4
- Technical documentation finalized – End of Week 6
- Functional MAMAR MVP completed – End of Week 10
- Final presentation and project closure – End of Week 12
