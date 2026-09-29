
# MAMAR | Temporary Traffic Control Management Platform

## 1. Project Objectives

### Purpose

The purpose of MAMAR is to provide a centralized GIS-based B2B platform that connects contractors with traffic control service providers and simplifies the management, coordination, and documentation of temporary traffic control operations for construction and roadwork projects.

### SMART Objectives

1. Develop and integrate six core MAMAR MVP features: user authentication, project creation, work zone mapping, service requests, provider selection, and project status tracking by the end of the MVP development stage.

2. Implement the field documentation workflow as an additional MVP component, enabling traffic control service providers to record implemented traffic control elements, attach site information and photos, and update the implementation status before the end of the MVP development stage.

3. Complete and test one end-to-end MAMAR workflow covering project creation, work zone definition, service request submission, provider selection, project status tracking, and field documentation, ensuring that all steps can be successfully demonstrated before the final project presentation.

### SMART Team Goal

| **SMART Element** | **Description** |
| --- | --- |
| **Goal** | Develop a functional MVP of MAMAR, a B2B platform that connects contractors with traffic control service providers and supports temporary traffic control operations through an integrated digital workflow with geospatial capabilities. |
| **S – Specific** | Develop the MAMAR MVP with six core platform features and an additional field documentation workflow covering the main process from project creation to field implementation documentation. |
| **M – Measurable** | Complete and integrate the six defined core platform features and the field documentation workflow, and verify that one complete end-to-end workflow can be successfully completed. |
| **A – Achievable** | Divide development tasks among team members based on their responsibilities in frontend development, backend development, UI/UX integration, project management, and GIS integration, while reviewing progress regularly. |
| **R – Relevant** | MAMAR addresses the need for a centralized platform to organize, coordinate, and document temporary traffic control operations for construction and roadwork projects. |
| **T – Time-bound** | Complete and demonstrate the functional MVP by the end of the project period, with weekly progress reviews throughout development. |

## 2. Stakeholders and Team Roles

### Team Roles

| **Team Member** | **Role** | **Responsibilities** |
| --- | --- | --- |
| Kayan Alnazari | Frontend Developer | Develop the user interface, dashboards, responsive frontend components, and connect frontend features with the application services. |
| Jana Alhazmi | Frontend Developer & UI/UX Integration | Support frontend development and UI/UX implementation, including interface design, user flows, responsive components, and integration of approved interface designs into the application. |
| Shouq Alqarni | Backend Developer | Develop backend services, authentication, business logic, and APIs. |
| Razan Kashr | Project Manager & GIS Integration Lead | Coordinate project planning, task distribution, and team progress, while leading GIS data preparation and the integration of mapping and geospatial functionality into the platform. |
| All team members | Development Team | Collaborate on planning, integration, testing, documentation, debugging, and project delivery. |

### Stakeholders

| **Stakeholder** | **Type** | **Involvement** |
| --- | --- | --- |
| Kayan Alnazari | Internal | Frontend Development |
| Shouq Alqarni | Internal | Backend Development |
| Razan Kashr | Internal | Project Management & GIS Integration |
| Jana Alhazmi | Internal | Frontend Development & UI/UX Integration |
| Instructors / Tutors | Internal | Project guidance, feedback, and evaluation. |
| Platform Administrators | Internal | Manage user accounts, monitor platform activities, and oversee system-level operations. |
| Contractors | External | Potential users who request traffic control services. |
| Traffic Control Service Providers | External | Potential users who manage traffic control service requests, coordinate field implementation, and document completed work through their field teams. |

## 3. Define Scope

### In-Scope

- Users log in with defined roles such as Contractor, Traffic Control Service Provider, and Platform Administrator.
- The contractor creates a project, defines the work zone on the map, uploads the approved traffic plan, and submits a service request.
- Traffic control service providers can view relevant service requests and provide quotations, and the contractor can select a provider.
- Traffic control elements such as signs and barriers can be represented on the map, while the Traffic Control Service Provider documents field implementation by attaching site information and photos and updating the completion status.
- The project dashboard shows implementation progress, mapped traffic control elements, supporting field documentation, and project status records.

### Out-of-Scope

- A separate mobile application. The MVP will be developed as a responsive web-based platform.
- Real online payments through a payment gateway.
- Designing or approving traffic plans inside the platform. The contractor uploads a traffic plan that has already been approved.
- Connecting to government systems or live traffic data.
- Covering cities outside Riyadh for now.

## 4. Identify Risks and Mitigation Plans

| **Risk** | **Mitigation** |
| --- | --- |
| Limited development time may affect completion of planned MVP features. | Prioritize core MVP features, divide work into weekly goals, and review progress regularly. |
| Scope expansion during development. | Keep the agreed MVP scope fixed and move non-essential ideas to future enhancements unless they are required for the core workflow. |
| Some tools or technologies are new to the team. | Build small prototypes and test unfamiliar technologies early before integrating them into the full system. |
| GIS and web integration may introduce technical complexity. | Test mapping and spatial-data integration early with small prototypes, then integrate it progressively with the main application. |
| Limited availability of accurate real-world traffic control and service-provider data. | Use structured sample datasets for the MVP while designing the data model so real data can be supported in future development. |
| Integration issues between frontend, backend, APIs, and GIS components. | Integrate and test system components progressively throughout development instead of waiting until the final stage. |

## 5. Develop a High-Level Plan

| **Stage** | **Timeline** | **Key Deliverables** |
| --- | --- | --- |
| Stage 1: Idea Development | Sep 13–19 | Team formation, brainstorming, idea selection, problem identification, and development of the MAMAR platform concept. |
| Stage 2: Project Charter Development | Sep 20–26 | Define project objectives, team roles, stakeholders, project scope, risks and mitigation plans, develop the high-level project plan, and begin preliminary preparation of the required geospatial data. |
| Stage 3: Technical Documentation | Sep 27–Oct 10 | Prepare user stories and mockups, system architecture, database design, sequence diagrams, API specifications, GIS requirements, SCM and QA plans, technical justifications, user flows, and UI/UX documentation. |
| Stage 4: MVP Development | Oct 11–Nov 21 | Develop the MAMAR MVP, including user authentication, project creation, work zone mapping, service requests, provider selection, field documentation, dashboards, and system integration between frontend, backend, APIs, and GIS components. |
| Stage 5: Project Closure | Nov 22–Dec 5 | Complete final testing and bug fixing, finalize project documentation, prepare the final presentation and demo, and deliver the final MVP. |

### Stage Dependencies

- **Stage 2 depends on Stage 1:** The selected MAMAR concept and defined problem provide the foundation for the Project Charter.
- **Stage 3 depends on Stage 2:** The approved objectives, stakeholders, scope, risks, and project plan provide the requirements needed to create the technical documentation.
- **Stage 4 depends on Stage 3:** Development begins based on the documented architecture, user stories, database design, APIs, UI/UX designs, GIS requirements, and technical decisions.
- **Stage 5 depends on Stage 4:** Final testing, documentation, demonstration, and project delivery require the functional MVP developed during Stage 4.

### Key Milestones

- Idea approved and team formed – End of Week 1
- Project Charter completed – End of Week 2
- Technical documentation finalized – End of Week 4
- Functional MAMAR MVP completed – End of Week 10
- Final presentation and project closure – End of Week 12

---

## Authors

- Razan Kashr
- Kayan Alnazari
- Shouq Alqarni
- Jana Alhazmi
