# Individual Contribution Log - Sprint 3

**Name:** Harsh Patel (40341498)

**Repository**: [CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

---

## 1. Summary of Contributions

During Sprint 3, I continued ownership of the recruiter-facing side of the platform and completed the posting management and candidate review features:

- Implemented **archive and restore for job postings** (US-28). Recruiters can archive a posting from the dashboard, view it under a dedicated **Archived** tab, and unarchive it. Archived postings are hidden from the default dashboard view and from the public job search.
- Added the **database support for archiving** (`archived` and `archived_at` columns on `jobs`) and updated the schema file so fresh setups match.
- Built the **archive API** (`PATCH /api/recruiter/jobs/:id/archive`) with a controller and route, restricted to recruiters of the posting's own company, and added an `?archived=true` filter to the recruiter job list endpoint.
- Hid archived postings from job seekers: removed them from the public job search results and from the job seeker's applications list.
- Implemented **candidate review and status management** (US-29). The recruiter dashboard links each posting's candidate total to its applications, and recruiters can update each application's status.
- Implemented the **automatic closing rule**: when the number of Offered applications reaches a job's openings, the job is closed and all other pending applications are marked Rejected in a single database transaction. The candidates page reloads and tells the recruiter what happened.
- Fixed a **UI bug in the job status dropdown** on the recruiter dashboard, which was clipped by the table and caused scrolling. The menu now floats over the page.
- Updated and extended the **Jest test suites** for the recruiter dashboard endpoint and added a new suite for the archive endpoint.

---

## 2. Activity & Time Log

| Task / Feature Module | Description | Time Spent (approx) | Artifacts/Links |
| :--- | :--- | :--- | :--- |
| **Archive Database Changes** | Added `archived` and `archived_at` columns to the `jobs` table, wrote a migration, and updated `schema.sql`. | ~[1] hrs | `schema.sql` |
| **Archive Backend** | Created `archiveController.js` and `archiveRoutes.js`, mounted them in `app.js`, added the `?archived=true` filter to `recruiterController.js`, and excluded archived jobs from `jobSearchController.js`. | ~[4] hrs | `src/api/controllers/archiveController.js`, `src/api/routes/archiveRoutes.js` |
| **Archived Jobs UI** | Archive button on the recruiter dashboard, and the Archived tab (`archived-jobs.html` / `archived-jobs.js`) with filter, sort and unarchive. | ~[1] hrs | `public/archived-jobs.html`, `public/js/archived-jobs.js` |
| **Dashboard Status Menu Fix** | Changed the job status dropdown to a fixed-position menu placed by JavaScript so it is no longer clipped by the jobs table. | ~[1] hrs | `recruiter-dashboard.css`, `recruiter-dashboard.js` |
| **Candidate Review and Auto-Close** | Added the rule in `applicationsRoutes.js` that closes a job and rejects the remaining pending applications once Offered applications reach the number of openings, and updated `applications.js` to refresh the list and show a confirmation message. Hid archived jobs from the job seeker's application list. | ~[2] hrs | `src/api/routes/applicationsRoutes.js`, `public/js/applications.js` |
| **Automated Test Suites** | Updated the recruiter dashboard tests for the new `archived` query parameter, added a test for `?archived=true`, and wrote `archiveJobs.test.js` covering authentication, the recruiter-only guard, archive and unarchive, 404 and 500 responses. | ~[1.5] hrs | `tests/recruiterDashboard.test.js`, `tests/archiveJobs.test.js` |
| **Documentation & Issue Linking** | Wrote user stories US-28 and US-29, created acceptance test issues, and contributed to the Sprint 3 Summary Report. | ~[1] hrs | Issues #72, #73 |

**Total Time Spent:** ~[4] Days (~[11.5] Hours)

---

## 3. Key Links to Artifacts

### Pull Requests

- [**PR #[28]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/72): `Archive and restore job postings`
- [**PR #[29]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/73): `Candidate review and auto-close on filled openings`

### User Stories & Tasks Completed

- [**US-28**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/72): Archive and restore job postings
- [**US-29**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/73): View and filter applications for a job posting
- [**US-18**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/38): Application Dashboard (archived postings now excluded from job search results)

### Acceptance Tests Issues

- [**Issue #[81]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/81): `[Test] Recruiter archives a posting and it disappears from the dashboard and job search`
- [**Issue #[82]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/82): `[Test] Recruiter restores an archived posting`
- [**Issue #[83]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/83): `[Test] Recruiter offers the last opening and the job closes with other applicants rejected`

---

## 4. AI Usage

I used Claude as an assistant for the archive feature, the status menu fix and the auto-close rule, and for drafting the unit tests and user stories. I reviewed the generated code and tested the behaviour in the running application before keeping it.

| Use | What the AI produced | How I validated and modified it |
| :--- | :--- | :--- |
| Diagnosing the archive "endpoint not found" error | Identified that the server route and database columns did not exist | Confirmed against `app.js` and the 404 handler |
| Archive controller, routes, and list filters | First draft of the files | Adjusted the `require` paths and checked ownership scoping by `company_id` |
| Status menu fix | CSS and JavaScript change | Tested in the browser |
| Auto-close rule | Transaction logic in `applicationsRoutes.js` | Tested with two job seekers; confirmed the response includes `job_closed` and the second applicant becomes rejected |
| Unit tests | Updated and new Jest tests | Updated the existing test I had; confirm `archive.test.js` passes in CI before submitting |