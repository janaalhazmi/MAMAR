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
| TC23 | Register | Create account | Account is created through backend | Not Tested |
| TC24 | Contractor Dashboard | Refresh after login | Valid session remains active and dashboard stays open | PASS |
| TC25 | Protected Route | Open contractor dashboard in a fresh private window | Redirects to `/login` | PASS |

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
- New account registration, provider login, token expiry, and API failure scenarios remain Not Tested.

## QA Notes

- Landing, Login, Register, and Project Location pages are implemented.
- Navigation between current frontend pages is working.
- Basic form validation is working.
- ArcGIS frontend structure has been added.
- Full Web Map display and GIS data integration are still pending.
- Login and Register call FastAPI on the tested feature branch. Contractor login was verified; new account registration remains Not Tested.

## Sprint 1 QA Status

- Frontend UI Testing: Completed
- Navigation Testing: Completed
- Basic Form Validation: Completed
- ArcGIS Frontend Setup: Completed
- GIS Data Integration: Pending
- Backend Integration Testing: Partially tested on `feature/frontend-auth` at `74a48c7`
- Authentication Testing: Contractor login, refresh persistence, and unauthenticated redirect passed on the tested commit; remaining scenarios are Not Tested.
