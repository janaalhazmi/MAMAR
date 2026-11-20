# MAMAR – Sprint 6 Review and Retrospective

> **Documentation note:** Compiled retrospectively on November 20, 2026 using the supplied GitHub Projects board snapshot. This is a records-based review, **not evidence of a contemporaneous sprint review or retrospective meeting**. Current statuses do not establish historical completion dates.

## 1. Sprint Overview

| Item | Details |
| --- | --- |
| Project | MAMAR – Temporary Traffic Control Management Platform |
| Stage | Stage 4: MVP Development and Execution |
| Sprint | Sprint 6 |
| Sprint Period | November 15–21, 2026 |
| Documentation Date | November 20, 2026 |
| Sprint Duration | 1 week |
| Tracking | GitHub Projects and GitHub Issues |

### Team Roles

Razan Kashr — Project Manager / GIS Lead / QA; Jana Alhazmi — Frontend / SCM; Kayan Alnazari — Frontend / QA; Shouq Alqarni — Backend. Individual issue assignments should be verified from GitHub.

## 2. Sprint Objectives

The tracked sprint theme was **Final testing, acceptance validation, documentation, and defect tracking**. The scope recorded on the board comprised:

- [Backend Unit & Integration Testing Using Pytest](https://github.com/janaalhazmi/MAMAR/issues/72) (#72)
- [Frontend Unit & Component Testing Using Vitest](https://github.com/janaalhazmi/MAMAR/issues/73) (#73)
- [Testing Documentation & Quality Assurance Report](https://github.com/janaalhazmi/MAMAR/issues/74) (#74)
- [Fix Provider Dashboard Navigation After Successful Quotation Submission](https://github.com/janaalhazmi/MAMAR/issues/77) (#77)
- [MVP End-to-End Validation & Acceptance Testing](https://github.com/janaalhazmi/MAMAR/issues/78) (#78)
- [Field Worker Site Photos Are Not Displayed After Upload](https://github.com/janaalhazmi/MAMAR/issues/79) (#79)
- [Service Provider Shows as "Not Assigned" in Completion Review](https://github.com/janaalhazmi/MAMAR/issues/80) (#80)

## 3. Sprint Deliverables and Progress

| Issue | Tracked deliverable | Current board status |
| --- | --- | --- |
| [#72](https://github.com/janaalhazmi/MAMAR/issues/72) | Backend Unit & Integration Testing Using Pytest | Todo |
| [#73](https://github.com/janaalhazmi/MAMAR/issues/73) | Frontend Unit & Component Testing Using Vitest | Done |
| [#74](https://github.com/janaalhazmi/MAMAR/issues/74) | Testing Documentation & Quality Assurance Report | In Progress |
| [#77](https://github.com/janaalhazmi/MAMAR/issues/77) | Fix Provider Dashboard Navigation After Successful Quotation Submission | Done |
| [#78](https://github.com/janaalhazmi/MAMAR/issues/78) | MVP End-to-End Validation & Acceptance Testing | In Progress |
| [#79](https://github.com/janaalhazmi/MAMAR/issues/79) | Field Worker Site Photos Are Not Displayed After Upload | Todo |
| [#80](https://github.com/janaalhazmi/MAMAR/issues/80) | Service Provider Shows as "Not Assigned" in Completion Review | Todo |

### Current board snapshot (November 20, 2026)

| Status | Count |
| --- | ---: |
| Done | 2 |
| In Progress | 2 |
| Todo | 3 |
| **Total** | **7** |

**Current task completion: 2/7 (28.6%).** This reflects the snapshot, not verified completion at the original sprint deadline.

## 4. Quality Assurance Review

The project QA summary records **807/807 frontend tests** and **247/247 backend tests** passing in the executed automated suites (1,054 total), with frontend statement coverage **91.37%** and backend statement coverage **92%**. These are overall Stage 4 results, **not a claim that all tests ran during this sprint or that issue #72 has been accepted**.

Manual UAT included project #73 (partial, off-site negative GPS case) and project #79 (completion path observed with photo visibility defect). The photo issue (#79) and provider association issue (#80) remained open in the supplied board snapshot. Final sign-off is pending retesting and evidence.

## 5. Challenges and Deviations

### Traceable considerations

- Current board status still shows backend testing (#72) as Todo despite separately recorded successful test execution; acceptance and status need reconciliation.
- Site-photo visibility (#79) and provider association display (#80) remain open in the snapshot.
- The end-to-end QA report and UAT tasks (#74, #78) remain In Progress; do not claim final release approval.

## 6. Sprint Review Outcome

The supplied November 20 board snapshot lists **2 Done, 2 In Progress, and 3 Todo** out of 7 tracked Sprint 6 tasks. The sprint period was still underway at the time of this snapshot.

## 7. Sprint Retrospective

> The following are records-based reflections and suggested improvements, **not verified minutes of a team retrospective meeting**.

### 7.1 What Went Well

- The sprint work was grouped around a clear theme: Final testing, acceptance validation, documentation, and defect tracking.
- GitHub Issues and the sprint board make the tracked deliverables identifiable.

### 7.2 What Could Be Improved

- Capture dated sprint-end task statuses and link associated pull requests.
- Attach test execution evidence to the relevant QA issue.
- Separate implementation completion from QA acceptance and release sign-off.

### 7.3 Suggested Action Items

- Reconcile GitHub issue statuses with test execution and acceptance criteria.
- Retest open photo and provider-association defects before final sign-off.

These are **recommendations**, not verified historical assignments.

## 8. Next Steps

Close remaining defects, update QA evidence, and capture final sprint status after November 21.

## 9. Conclusion

Sprint 6 records show progress on final testing, acceptance validation, documentation, and defect tracking. This report documents the **current board state** and reviewable evidence gaps without claiming unverified meetings, historical sprint-end completion, or final acceptance.

---

**Prepared as:** Retrospective documentation from project records  
**Documentation date:** November 20, 2026  
**Primary reference:** [GitHub Sprint Metrics](https://github.com/users/janaalhazmi/projects/6/views/3)
