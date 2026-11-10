## GitHub Branching and Collaboration Workflow

### 1. Branching Strategy

The MAMAR development team follows a structured Git branching workflow to support collaboration and maintain code quality.

The repository uses the following branches:

| Branch | Purpose |
|--------|---------|
| `main` | Stable version of the project. |
| `development` | Main integration branch for ongoing development. |
| `feature/frontend-*` | Frontend development and UI features. |
| `feature/backend-*` | Backend development, APIs, and database functionality. |
| `feature/gis-*` | GIS integration and mapping functionality. |

All new features should be developed in dedicated feature branches before being merged into `develop`.

### 2. Branch Naming Conventions

Feature branches should follow this naming format:

`feature/<component>-<description>`

Examples:

- `feature/frontend-auth`
- `feature/backend-setup`
- `feature/gis-map-integration`

Branch names should be lowercase and use hyphens between words.

### 3. Development Workflow

1. Create a feature branch from `development`.
2. Implement the assigned task.
3. Commit changes with clear and descriptive commit messages.
4. Push the feature branch to GitHub.
5. Open a Pull Request targeting `development`.
6. Request a code review from another team member.
7. Address any feedback before merging.
8. Merge approved changes into `development`.
9. Merge `development` into `main` when a stable release is ready.

### 4. Pull Request Review Process

Each Pull Request should include:

- A clear title describing the changes.
- A summary of the implemented functionality.
- Reference to the related GitHub Issue, when applicable.
- Testing results or supporting evidence.
- Any known limitations or pending work.

Before merging, the reviewer should verify:

- The code follows the project structure.
- The implementation meets the task requirements.
- No unnecessary or duplicate files are introduced.
- The changes do not introduce known errors.
- Any identified issues are resolved or documented.

### 5. Team Responsibilities

| Team Member | Responsibility |
|-------------|----------------|
| Jana Alhazmi | Frontend Development and Repository Coordination |
| Razan Kashr | Project Management, GIS Integration, and Quality Assurance |
| Kayan Alnazari | Frontend Development and Quality Assurance |
| Shouq Alqarni | Backend Development and Database Management |

### 6. GitHub Issues and Project Tracking

Development tasks are tracked through GitHub Issues and the MAMAR GitHub Project board.

The team uses the following statuses:

- **Todo:** Task has not started.
- **In Progress:** Task is currently being implemented.
- **In Review:** Task is awaiting review or verification.
- **Blocked:** Task cannot proceed due to an unresolved issue.
- **Done:** Task has been completed and verified.

Each task should have an assigned owner, priority, sprint, and due date.

### 7. Code Quality and Collaboration

To maintain an organized development process:

- Avoid committing directly to `main`.
- Use Pull Requests for integrating feature changes.
- Review code before merging.
- Keep commit messages meaningful.
- Do not commit passwords, API keys, or database credentials.
- Communicate blockers and update task statuses regularly.
## Deployment & Setup

### Frontend Deployment
- Platform: Vercel
- Live URL: https://mammar-blush.vercel.app/
- Framework: React + Vite

### Backend Deployment
- Platform: Render
- API URL: https://mamar-api.onrender.com
- Framework: FastAPI
- Database: PostgreSQL

### Integration
- The frontend communicates with the backend through REST API requests.
- CORS is configured to allow requests from the deployed frontend.
- User registration and login have been tested successfully.

### Environment Configuration
- The frontend requires the backend API URL.
- The backend requires database connection settings.
- Sensitive environment variables must be configured securely and must not be committed to GitHub.

### Deployment Verification
- Frontend deployment: Verified.
- Backend deployment: Verified.
- Frontend-to-backend API communication: Verified.
- Registration and login: Verified.
- Redeployment after code updates: Pending verification.

