# MAMAR – Sprint 5 Review and Retrospective

> **Documentation note:** Compiled retrospectively on November 20, 2026 using the supplied GitHub Projects board snapshot. This is a records-based review, **not evidence of a contemporaneous sprint review or retrospective meeting**. Current statuses do not establish historical completion dates.

## 1. Sprint Overview

| Item | Details |
| --- | --- |
| Project | MAMAR – Temporary Traffic Control Management Platform |
| Stage | Stage 4: MVP Development and Execution |
| Sprint | Sprint 5 |
| Sprint Period | November 8–14, 2026 |
| Documentation Date | November 20, 2026 |
| Sprint Duration | 1 week |
| Tracking | GitHub Projects and GitHub Issues |

### Team Roles

Razan Kashr — Project Manager / GIS Lead / QA; Jana Alhazmi — Frontend / SCM; Kayan Alnazari — Frontend / QA; Shouq Alqarni — Backend. Individual issue assignments should be verified from GitHub.

## 2. Sprint Objectives

The tracked sprint theme was **Secondary features, payment, notifications, and database hosting**. The scope recorded on the board comprised:

- [Payment Gateway Integration](https://github.com/janaalhazmi/MAMAR/issues/48) (#48)
- [In-App Notifications](https://github.com/janaalhazmi/MAMAR/issues/49) (#49)
- [Complete Secondary Features & UI Enhancements](https://github.com/janaalhazmi/MAMAR/issues/50) (#50)
- [Migrate PostgreSQL Database from Render to Supabase](https://github.com/janaalhazmi/MAMAR/issues/51) (#51)

## 3. Sprint Deliverables and Progress

| Issue | Tracked deliverable | Current board status |
| --- | --- | --- |
| [#48](https://github.com/janaalhazmi/MAMAR/issues/48) | Payment Gateway Integration | Done |
| [#49](https://github.com/janaalhazmi/MAMAR/issues/49) | In-App Notifications | Done |
| [#50](https://github.com/janaalhazmi/MAMAR/issues/50) | Complete Secondary Features & UI Enhancements | Done |
| [#51](https://github.com/janaalhazmi/MAMAR/issues/51) | Migrate PostgreSQL Database from Render to Supabase | Done |

### Current board snapshot (November 20, 2026)

| Status | Count |
| --- | ---: |
| Done | 4 |
| In Progress | 0 |
| Todo | 0 |
| **Total** | **4** |

**Current task completion: 4/4 (100.0%).** This reflects the snapshot, not verified completion at the original sprint deadline.

## 4. Quality Assurance Review

The recorded QA scope includes payment, notifications, secondary features, and database migration verification. Current issue statuses indicate tracked work, but the screenshots do not provide sprint-specific execution logs, test counts, or historical acceptance results. Link such artifacts if available.

## 5. Challenges and Deviations

### Traceable considerations

- PostgreSQL hosting was migrated from Render to Supabase (#51), making connection configuration and data integrity important review points.
- Payment gateway and notification integrations (#48, #49) require environment-specific validation; do not equate sandbox payments with production transactions.

## 6. Sprint Review Outcome

The supplied November 20 board snapshot lists **4 Done, 0 In Progress, and 0 Todo** out of 4 tracked Sprint 5 tasks. The historical status at the sprint deadline has not been independently verified.

## 7. Sprint Retrospective

> The following are records-based reflections and suggested improvements, **not verified minutes of a team retrospective meeting**.

### 7.1 What Went Well

- The sprint work was grouped around a clear theme: Secondary features, payment, notifications, and database hosting.
- GitHub Issues and the sprint board make the tracked deliverables identifiable.

### 7.2 What Could Be Improved

- Capture dated sprint-end task statuses and link associated pull requests.
- Attach test execution evidence to the relevant QA issue.
- Separate implementation completion from QA acceptance and release sign-off.

### 7.3 Suggested Action Items

- Verify payment integration using sandbox transactions, without implying real payments.
- Validate database migration configuration and connectivity; retain migration/rollback evidence if available.

These are **recommendations**, not verified historical assignments.

## 8. Next Steps

Sprint 6 focused on automated testing, end-to-end UAT, documentation, and defect follow-up.

## 9. Conclusion

Sprint 5 records show progress on secondary features, payment, notifications, and database hosting. This report documents the **current board state** and reviewable evidence gaps without claiming unverified meetings, historical sprint-end completion, or final acceptance.

---

**Prepared as:** Retrospective documentation from project records  
**Documentation date:** November 20, 2026  
**Primary reference:** [GitHub Sprint Metrics](https://github.com/users/janaalhazmi/projects/6/views/3)
