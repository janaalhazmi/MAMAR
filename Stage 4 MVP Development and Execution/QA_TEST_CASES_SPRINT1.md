# MAMAR – Sprint 1 QA Test Cases

## QA Owner

Kayan Alnazari

## Sprint

Sprint 1 – Project Setup and Initial Development

## Testing Scope

- Landing page
- Login and registration
- Form validation and role selection
- Session handling and frontend route protection
- Contractor navigation
- Project creation flow and review
- Project location / ArcGIS
- Provider and Field Worker testing readiness

## Test Status Definitions

- Pass: Executed and the observed result matched the expected result.
- Fail: Executed and the observed result did not match the expected result.
- Blocked: Cannot complete testing because a required feature, account, or dependency is unavailable.
- Not Tested: Has not been executed or verified.

## Test Environment and Evidence

- Tester: Kayan Alnazari
- Test date: 2026-10-19
- Environment: Local frontend at `http://localhost:5173`
- Tested branch: `feature/frontend-auth`
- Application code reviewed for this run: `74a48c7`
- Subsequent commits added QA documentation.
- Current-run evidence: Manual execution reported by the tester; screenshots are not attached.
- Results apply to the tested feature branch and do not establish that the same behavior is available on `develop` or the deployed site.
- TC01–TC20 retain earlier recorded results. Their original execution date, tested commit, and evidence were not recorded in this document.
- Frontend route protection results do not establish backend authorization enforcement.

## Previously Recorded UI Tests

| ID | Page | Test Scenario | Expected Result | Status |
|---|---|---|---|---|
| TC01 | Landing | Open landing page | Landing page loads successfully | Pass |
| TC02 | Landing | Click Sign In | Opens `/login` | Pass |
| TC03 | Landing | Click Get Started | Opens `/register` | Pass |
| TC04 | Landing | Click Start a Project | Opens `/register` | Pass |
| TC05 | Landing | Click Explore MAMAR | Scrolls to How MAMAR Works | Pass |
| TC06 | Login | Select Contractor | Role becomes active | Pass |
| TC07 | Login | Select Provider | Role becomes active | Pass |
| TC08 | Login | Select Field Worker | Role becomes active | Pass |
| TC09 | Login | Submit without role | Validation message is displayed | Pass |
| TC10 | Login | Enter invalid email | Browser validation prevents submission | Pass |
| TC11 | Login | Toggle password visibility | Password becomes visible | Pass |
| TC12 | Register | Select Contractor | Role becomes active | Pass |
| TC13 | Register | Select Provider | Role becomes active | Pass |
| TC14 | Register | Select Field Worker | Role becomes active | Pass |
| TC15 | Register | Select Field Worker | Provider email instruction appears | Pass |
| TC16 | Register | Enter invalid email | Browser validation prevents submission | Pass |
| TC17 | Register | Toggle password visibility | Password becomes visible | Pass |
| TC18 | Register | Click Sign In | Opens `/login` | Pass |
| TC19 | Project Location | Open GIS page | `/project/location` loads | Pass |
| TC20 | Project Location | Load ArcGIS component | ArcGIS map component initializes | Pass |

## Current Test Run – 2026-10-19

| ID | Area | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC21 | GIS | Verify the configured MAMAR Web Map and required layers | Correct map and required layers are displayed | Full map and layer verification has not been completed | Not Tested |
| TC22 | Login | Log in with valid contractor credentials | Contractor dashboard opens and displays the account name | Dashboard opened and displayed the account name | Pass |
| TC23 | Register | Create a new contractor account and use it to log in | Account is created through the backend and can log in | Registration and subsequent login succeeded | Pass |
| TC24 | Session | Refresh contractor dashboard after login | Valid session remains active | User remained signed in after refresh | Pass |
| TC25 | Protected Route | Open contractor dashboard in a fresh private window | Redirects to `/login` | Redirected to login | Pass |
| TC26 | Login | Submit an incorrect password | Login is rejected with an error | Displayed `Email or password is wrong` | Pass |
| TC27 | Login | Select a role different from the account role | Login is rejected with a role mismatch error | Displayed `The selected account type does not match your account.` | Pass |
| TC28 | Register | Register a contractor using an existing email | Duplicate registration is rejected | Displayed `Email is already registered` | Pass |
| TC29 | Protected Route | Open `/provider-dashboard` while signed in as contractor | Provider dashboard is inaccessible | Redirected to the landing page | Pass |
| TC30 | Logout | Log out and then open contractor dashboard | Redirects to `/login` | Redirected to login | Pass |
| TC31 | Project Flow | Navigate through details, location, services, and review | Review page is reached without navigation failure | Reached review successfully | Pass |
| TC32 | Contractor Navigation | Open Providers | Displays a usable page or an explicit development notice | `/providers` displayed a blank page | Fail |
| TC33 | Contractor Navigation | Click Quotations | Displays or scrolls to the quotations section | `/contractor-dashboard#quotations` remained on the dashboard without reaching a quotations section | Fail |
| TC34 | Contractor Navigation | Click My Projects | Scrolls to the projects section | Scrolled to the projects section | Pass |
| TC35 | Contractor Navigation | Click Create Project | Opens the project creation page | Project creation page opened | Pass |
| TC36 | Location | Select a location point | Selected point and confirmation are displayed | Yellow point appeared with `Location selected successfully` | Pass |
| TC37 | Review | Compare review data with entered selections | Project details, services, and location match the selections | Tester confirmed that all selections matched | Pass |
| TC38 | GIS | Draw and edit a project polygon | Project boundary can be drawn, edited, and retained between steps | Current implementation selects a point; polygon testing cannot be completed | Blocked |
| TC39 | Field Worker | Open dashboard and execute workflows | Field Worker pages and workflows are available for testing | Frontend pages and routes are not implemented yet | Blocked |
| TC40 | Provider Registration | Register a provider using valid test provider data | Provider account can be created using the approved registration flow | Attempt returned `Provider not found`; valid provider test data is required | Blocked |
| TC41 | Provider Login | Log in with a valid provider account | Provider dashboard opens and displays the account data | Valid provider test account is not available for this run | Blocked |
| TC42 | Session | Verify token expiry | Expired session cannot continue accessing protected pages | Not executed | Not Tested |
| TC43 | Provider Authorization | Open contractor dashboard while signed in as provider | Contractor dashboard is inaccessible | Requires a valid provider test account | Blocked |
| TC44 | API Errors | Attempt authentication when the backend is unavailable | Clear connection error appears and loading state ends | Not executed | Not Tested |
| TC45 | Deployment | Register and log in from the deployed frontend | Requests succeed without CORS or field mismatch errors | Not executed on the deployed site | Not Tested |
| TC46 | Navigation | Audit remaining visible links and buttons | No visible control leads to a blank page or invalid route | Remaining controls have not all been checked | Not Tested |
| TC47 | Project State | Refresh or revisit project steps | Project draft behaves according to the agreed persistence requirements | Persistence after refresh has not been verified | Not Tested |
| TC48 | Review UI | Inspect review styling against the approved design | Page styling matches the approved design | Text is displayed, but styling appears incomplete; detailed comparison is pending | Not Tested |
| TC49 | Geographic Search | Search for a location and select a result | Map moves to the selected location | Not executed | Not Tested |
| TC50 | Map Consistency | Compare selected geometry across location, services, and review maps | The same selected geometry is displayed in all map views | Detailed map comparison has not been completed | Not Tested |
| TC51 | Project Submission | Verify saving and retrieval through the backend | Submitted project can be retrieved with correct data | Final submission and database persistence were not tested | Not Tested |

## Issues and Follow-up

### Providers Link – TC32

- Observed result: `/providers` displays a blank page.
- Status: Fail.
- Required action: Implement the route, hide the unfinished link, or display an explicit development notice.
- Implementation ownership is not confirmed.
- Retest after the change.

### Quotations Link – TC33

- Observed result: `/contractor-dashboard#quotations` does not navigate to a quotations section.
- Status: Fail.
- Required action: Connect the link to the intended page or section, or handle the unfinished feature explicitly.
- Implementation ownership is not confirmed.
- Retest after the change.

### Polygon Requirement – TC38

- Current point selection works.
- Polygon drawing and editing are incomplete.
- The tester reports that the current Figma design uses point selection.
- Clarify the difference between the current design and Razan's polygon requirement.
- Polygon testing remains Blocked until the required implementation is available.

### Review Styling – TC48

- Review text is displayed and selected data matches the user's input.
- Styling appears incomplete.
- Confirm the approved design and implementation ownership.
- Functional navigation success does not establish visual completion.

### Provider Testing – TC40, TC41, TC43

- Provider registration was attempted and returned `Provider not found`.
- This result does not establish a frontend defect or successful provider registration.
- Obtain a valid provider test account or existing Provider ID and the approved registration procedure from the backend team.
- Complete provider registration, login, session, logout, and role access tests when valid test data is available.

### Field Worker Testing – TC39

- Field Worker frontend pages and routes are not implemented yet.
- Dashboard and workflow testing remains Blocked.
- Earlier role-selection UI tests do not establish working Field Worker authentication or workflows.
- Retest when the frontend is available and valid test credentials are provided.

## QA Summary

- Contractor authentication: Nine scenarios passed in the current run, including registration/login, validation errors, session refresh, logout, and tested frontend access restrictions.
- Project flow: Navigation to review passed.
- Review data: Entered details and selected services and location matched the review.
- Contractor navigation: Providers and Quotations failed and require fixes and retesting.
- GIS: Point selection passed. Full Web Map/layer verification, geographic search, and detailed map consistency remain Not Tested.
- Polygon: Incomplete; testing is Blocked.
- Provider: Testing is Blocked pending valid test data.
- Field Worker: Dashboard and workflow testing is Blocked pending frontend implementation.
- API failure handling, token expiry, deployed integration, and project persistence remain unverified.
- QA is partially complete. Do not mark the full task Done until the required tests, evidence, fixes, and retests are complete.