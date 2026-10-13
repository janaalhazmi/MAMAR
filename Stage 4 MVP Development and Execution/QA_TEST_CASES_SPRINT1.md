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
| TC22 | Login | Authenticate valid user | User logs in through backend | NOT IMPLEMENTED |
| TC23 | Register | Create account | Account is created through backend | NOT IMPLEMENTED |

## QA Notes

- Landing, Login, Register, and Project Location pages are implemented.
- Navigation between current frontend pages is working.
- Basic form validation is working.
- ArcGIS frontend structure has been added.
- Full Web Map display and GIS data integration are still pending.
- Login and Register are not yet connected to FastAPI.

## Sprint 1 QA Status

- Frontend UI Testing: Completed
- Navigation Testing: Completed
- Basic Form Validation: Completed
- ArcGIS Frontend Setup: Completed
- GIS Data Integration: Pending
- Backend Integration Testing: Pending
- Authentication Testing: Pending
