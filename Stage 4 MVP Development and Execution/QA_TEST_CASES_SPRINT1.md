# MAMAR – Sprint 1 QA Test Cases

## QA Owner
Kayan Alnazari

## Sprint
Sprint 1 – Project Setup and Initial Development

## Testing Scope
- Landing Page
- Login Page
- Register Page
- Navigation
- Form validation
- Role selection
- Project Location / ArcGIS page

## Test Cases

| ID | Page | Test Scenario | Expected Result | Status |
|---|---|---|---|---|
| TC01 | Landing | Open landing page | Landing page loads successfully | PASS |
| TC02 | Landing | Click Sign In | Opens `/login` | PASS |
| TC03 | Landing | Click Get Started | Opens `/register` | PASS |
| TC04 | Landing | Click Start a Project | Opens `/register` | PASS |
| TC05 | Landing | Click Explore MAMAR | Scrolls to How MAMAR Works | PASS |
| TC06 | Login | Select Contractor | Role becomes active | PASS |
| TC07 | Login | Select Provider | Role becomes active | PASS |
| TC08 | Login | Select Field Worker | Role becomes active | PASS |
| TC09 | Login | Submit without role | Alert is displayed | PASS |
| TC10 | Login | Invalid email | Browser validation prevents submission | PASS |
| TC11 | Login | Show password | Password becomes visible | PASS |
| TC12 | Register | Select Contractor | Role becomes active | PASS |
| TC13 | Register | Select Provider | Role becomes active | PASS |
| TC14 | Register | Select Field Worker | Role becomes active | PASS |
| TC15 | Register | Field Worker message | Provider email instruction appears | PASS |
| TC16 | Register | Invalid email | Browser validation prevents submission | PASS |
| TC17 | Register | Show password | Password becomes visible | PASS |
| TC18 | Register | Sign In link | Opens `/login` | PASS |
| TC19 | Project Location | Open GIS page | `/project/location` loads | PASS |
| TC20 | Project Location | Load ArcGIS component | ArcGIS map component initializes | PASS |
| TC21 | Project Location | Display MAMAR Web Map | Existing map and layers display | PENDING |
| TC22 | Login | Authenticate valid contractor | Opens contractor dashboard and displays the account name | PASS |
| TC23 | Register | Create contractor account | Account is created through backend and can log in | PASS |
| TC24 | Contractor Dashboard | Refresh after login | Valid session remains active and dashboard stays open | PASS |
| TC25 | Protected Route | Open contractor dashboard in a fresh private window | Redirects to `/login` | PASS |
| TC26 | Login | Submit incorrect password | Rejects login with an error | PASS |
| TC27 | Login | Select a role different from the account role | Rejects login with a role mismatch error | PASS |
| TC28 | Register | Register a contractor with an existing email | Rejects duplicate registration | PASS |
| TC29 | Protected Route | Contractor opens `/provider-dashboard` | Redirects to landing page | PASS |
| TC30 | Logout | Log out, then open contractor dashboard | Redirects to `/login` | PASS |
| TC31 | Project Flow | Navigate through details, location, services, and review | Reaches review without navigation failure | PASS |

## Authentication Test Run - 2026-10-19

- Tester: Kayan Alnazari
- Environment: Local frontend
- Tested branch: `feature/frontend-auth`
- Tested commit: `74a48c7`
- TC22: Contractor login succeeded and the dashboard displayed the account name.
- TC24: Refreshing the dashboard preserved the session.
- TC25: Opening the dashboard in a fresh private window redirected to login.
- Evidence: Manual execution reported by the tester; screenshots have not been attached.
- These results apply to the tested commit, not to the current contents of `develop`.
- TC23: A new contractor account was created and successfully used to log in.
- TC26: Incorrect password was rejected: `Email or password is wrong`.
- TC27: Role mismatch was rejected: `The selected account type does not match your account.`
- TC28: Duplicate contractor email was rejected: `Email is already registered`.
- Provider registration attempt returned `Provider not found`; successful provider registration and login remain unverified.
- TC29: Contractor access to the provider dashboard redirected to the landing page.
- TC30: After logout, opening the contractor dashboard redirected to login.
- Token expiry, provider-to-contractor route access, API failures, and deployed-site integration remain Not Tested.

## QA Notes

- Landing, Login, Register, and Project Location pages are implemented.
- TC31: The tester reached review through project details, location, and services without navigation failure.
- Review displays text, but styling appears incomplete; ownership and expected styling require confirmation.
- Review data matched the entered selections (TC37). Persistence after refresh and database saving remain Not Tested.
- Remaining visible links still require verification.
- Basic form validation is working.
- ArcGIS frontend structure has been added.
- Full Web Map display and GIS data integration are still pending.
- Contractor registration and login through FastAPI were manually verified on the tested feature branch.

## Sprint 1 QA Status

- Frontend UI Testing: Partially tested; review styling and blank Providers page require follow-up
- Navigation Testing: Project flow to review passed; remaining links require verification
- Basic Form Validation: Completed
- ArcGIS Frontend Setup: Completed
- GIS Data Integration: Pending
- Backend Integration Testing: Partially tested on `feature/frontend-auth` at `74a48c7`
- Authentication Testing: Nine contractor authentication scenarios passed; remaining scenarios are Not Tested.

## Contractor Follow-up Tests - 2026-10-19

Environment: Local frontend  
Branch: `feature/frontend-auth`  
Evidence: Manual testing reported by Kayan Alnazari; screenshots are not attached.

| ID | Test Scenario | Actual Result | Status |
|---|---|---|---|
| TC32 | Open Providers from contractor account | `/providers` displays a blank page | Fail |
| TC33 | Open Quotations from contractor account | `/contractor-dashboard#quotations` stays on the dashboard without navigating to a quotations section | Fail |
| TC34 | Click My Projects | Scrolls to the user's projects section | Pass |
| TC35 | Click Create Project | Opens the project creation page | Pass |
| TC36 | Select a location point | Yellow point appears with `Location selected successfully` | Pass |
| TC37 | Compare review data with entered selections | Project details, services, and location match the user's selections | Pass |
| TC38 | Draw and edit a project polygon | Current selection uses a point; polygon requirement is incomplete | Blocked |
| TC39 | Open Field Worker dashboard and workflows | Cannot execute: Field Worker frontend pages and routes are not implemented yet | Blocked |

### Issues and Follow-up

- TC32 and TC33 require fixes and retesting. Implementation ownership is not yet confirmed.
- TC38: The tester reports that the current Figma design uses point selection. Clarify the polygon requirement with Razan before implementation.
- Review page styling appears incomplete and needs follow-up.
- Provider account testing has not started.
- This run does not verify project submission, database persistence, or all remaining links.
