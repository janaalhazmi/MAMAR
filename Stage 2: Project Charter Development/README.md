# MAMAR \| Temporary Traffic Control Management Platform🚧

## 0. Project Objectives

### Purpose

The purpose of MAMAR is to provide a centralized GIS-based B2B platform
that connects contractors with traffic control service providers and
simplifies the management, coordination, and documentation of temporary
traffic control operations for construction and roadwork projects.

### SMART Objectives

1.  Develop the MAMAR MVP with core features including user
    authentication, project creation, work zone mapping, service
    requests, provider selection, and project status tracking by the end
    of the MVP development stage.
2.  Implement location-based field documentation that allows traffic
    control providers to record implemented traffic control elements and
    attach site information and photos before the end of the MVP
    development stage.
3.  Complete and demonstrate the functional MVP through testing and bug
    fixing, ensuring that the main user workflow from project creation
    to field documentation can be successfully completed before the
    final project presentation.

### SMART Team Goals

  -------------------------------------------------------------------------------------------------------
             Goals            S How is it   M How is          A How is it    R How is it    T How is it
                              specific?     measurable?       attainable?    relevant?      time-based?
  ---------- ---------------- ------------- ----------------- -------------- -------------- -------------
             To develop a     Develop an    Complete the core Divide the     MAMAR          Complete and
             functional MVP   MVP of MAMAR  features,         development    addresses the  demonstrate
             of MAMAR, a B2B  that connects including user    tasks among    need for a     the MVP by
             platform that    contractors   authentication,   the team       centralized    the end of
             connects         with traffic  project creation, members based  platform to    the project
             contractors with control       interactive       on their roles organize and   development
             traffic control  service       mapping, service  in frontend,   document       period, with
             service          providers and requests,         backend,       temporary      regular
             providers,       allows users  provider          database and   traffic        weekly
             enabling them to to create     selection,        API            control        progress
             manage projects, projects,     project status    integration,   operations for reviews to
             define work      define work   tracking, and     and GIS and    construction   ensure all
             zones, request   zones,        field             geospatial     and roadwork   planned
             and coordinate   request       documentation.    integration.   projects.      features are
             traffic control  services,                                                     completed on
             services, and    select                                                        time.
             document field   providers,                                                    
             implementation   and track                                                     
             through an       project                                                       
             integrated       status.                                                       
             digital workflow                                                               
             with geospatial                                                                
             capabilities.                                                                  

  -------------------------------------------------------------------------------------------------------

## 1. Stakeholders and Team Roles

### Team Roles

  -----------------------------------------------------------------------
  Team Member             Role                    Responsibilities
  ----------------------- ----------------------- -----------------------
  Kayan Alnazari          Frontend Developer      Develop the user
                                                  interface, dashboards,
                                                  responsive frontend
                                                  components, and connect
                                                  frontend features with
                                                  the application
                                                  services.

  Jana Alhazmi            Database & API          Design and manage the
                          Integration             application database
                                                  and support data
                                                  exchange between the
                                                  frontend, backend APIs,
                                                  and system components.

  Shouq Alqarni           Backend Developer       Develop backend
                                                  services,
                                                  authentication,
                                                  business logic, and
                                                  APIs.

  Razan Kashr             Project Manager & GIS   Coordinate project
                          Integration Lead        planning, task
                                                  distribution, and team
                                                  progress, while leading
                                                  GIS data preparation
                                                  and the integration of
                                                  mapping and geospatial
                                                  functionality into the
                                                  platform.

  All team members        Development Team        Collaborate on
                                                  planning, integration,
                                                  testing, documentation,
                                                  debugging, and project
                                                  delivery.
  -----------------------------------------------------------------------

### Stakeholders

  -----------------------------------------------------------------------
  Stakeholder             Type                    Involvement
  ----------------------- ----------------------- -----------------------
  Kayan Alnazari          Internal                Frontend Development

  Shouq Alqarni           Internal                Backend Development

  Razan Kashr             Internal                Project Management &
                                                  GIS Integration

  Jana Alhazmi            Internal                Database & API
                                                  Integration

  Instructors / Tutors    Internal                Project guidance,
                                                  feedback, and
                                                  evaluation.

  Contractors             External                Potential users who
                                                  request traffic control
                                                  services.

  Traffic Control Service External                Potential users who
  Providers                                       manage traffic control
                                                  service requests,
                                                  coordinate field
                                                  implementation, and
                                                  document completed work
                                                  through their field
                                                  teams.

  Platform Administrators External                Potential users who
                                                  manage user accounts,
                                                  monitor platform
                                                  activities, and oversee
                                                  system-level
                                                  operations.
  -----------------------------------------------------------------------

## 2. Define Scope

### In-Scope:

-   Users log in with defined roles such as Contractor, Traffic Control
    Company, and Platform Administrator.
-   The contractor creates a project, defines the work zone on the map,
    uploads the approved traffic plan, and submits a service request.
-   Traffic control companies can view relevant service requests,
    provide quotations, and the contractor can select a provider.
-   Traffic control elements such as signs and barriers can be
    represented on the map, while the Traffic Control Service Provider
    documents field implementation by attaching site information and
    photos and updating the completion status.
-   The project dashboard shows implementation progress, mapped traffic
    control elements, supporting field documentation, and project status
    records.

### Out-of-Scope:

-   A separate mobile application. The MVP will be developed as a
    responsive web-based platform.
-   Real online payments through a payment gateway.
-   Designing or approving traffic plans inside the platform. The
    company uploads a plan that's already approved.
-   Connecting to government systems or live traffic data.
-   Covering cities outside Riyadh for now.

## 3. Identify Risks and Mitigation Plans

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Limited development time may affect Prioritize core MVP features,
  completion of planned MVP features  divide work into weekly goals, and
                                      review progress regularly.

  Scope expansion during development  Keep the agreed MVP scope fixed and
                                      move non-essential ideas to future
                                      enhancements unless they are
                                      required for the core workflow.

  Some tools or technologies are new  Build small prototypes and test
  to the team                         unfamiliar technologies early
                                      before integrating them into the
                                      full system.

  GIS and web integration may         Test mapping and spatial-data
  introduce technical complexity      integration early with small
                                      prototypes, then integrate it
                                      progressively with the main
                                      application.

  Limited availability of accurate    Use structured sample datasets for
  real-world traffic control and      the MVP while designing the data
  service-provider data               model so real data can be supported
                                      in future development.

  Integration issues between          Integrate and test system
  frontend, backend, database, APIs,  components progressively throughout
  and GIS components                  development instead of waiting
                                      until the final stage.
  -----------------------------------------------------------------------

## 4. Develop a High-Level Plan

  -----------------------------------------------------------------------
  Stage                   Timeline                Key Deliverables
  ----------------------- ----------------------- -----------------------
  Stage 1: Idea           Weeks 1--2              Team formation,
  Development --                                  brainstorming, idea
  Completed                                       selection, problem
                                                  identification, and
                                                  development of the
                                                  MAMAR platform concept.

  Stage 2: Project        Weeks 3--4              Define project
  Charter Development --                          objectives, team roles,
  Current                                         stakeholders, project
                                                  scope, risks and
                                                  mitigation plans, and
                                                  the high-level project
                                                  plan.

  Stage 3: Technical      Weeks 5--6              Prepare system
  Documentation                                   requirements, system
                                                  architecture, database
                                                  design, API structure,
                                                  GIS requirements, user
                                                  flows, and UI/UX
                                                  documentation.

  Stage 4: MVP            Weeks 7--10             Develop the MAMAR MVP
  Development                                     including user
                                                  authentication, project
                                                  creation, work zone
                                                  mapping, service
                                                  requests, provider
                                                  selection, field
                                                  documentation,
                                                  dashboards, system
                                                  integration between
                                                  frontend, backend,
                                                  database, APIs, and GIS
                                                  components.

  Stage 5: Project        Weeks 11--12            Final testing and bug
  Closure                                         fixing, complete
                                                  project documentation,
                                                  prepare the final
                                                  presentation and demo,
                                                  and deliver the final
                                                  MVP.
  -----------------------------------------------------------------------

### Key Milestones

-   Idea approved and team formed -- End of Week 2
-   Project Charter completed -- End of Week 4
-   Technical documentation finalized -- End of Week 6
-   Functional MAMAR MVP completed -- End of Week 10
-   Final presentation and project closure -- End of Week 12
