# Individual Contribution Log - Sprint 2

**Name:** Harsh Patel (40341498)

**Repository**: [CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

---

## 1. Summary of Contributions

During Sprint 2, I took primary ownership of the recruiter-facing side of the platform:

- Designed and implemented the **Recruiter Dashboard**, giving recruiters a central view of the jobs they have posted. [add: applicants / status / stats, if included]
- Implemented **Job Posting Management** (US-[24], US-[05]), allowing recruiters to create new job listings (title, company, location, description, requirements, deadline) through a dedicated form and backend API.
- Implemented **posting closure**, so closed postings show a "Closed" status and no longer appear in job seeker search. 
- Added **input validation** so submissions with missing required fields (e.g. empty Title) are rejected and no posting is created.
- Authored **Jest test suites** covering job posting creation, validation failures, and posting closure.

---

## 2. Activity & Time Log

| Task / Feature Module | Description | Time Spent (approx) | Artifacts/Links |
| :--- | :--- | :--- | :--- |
| **Job Posting Backend** | Created `[POST /api/jobs]` and related controller/model logic so recruiters can create jobs, with validation of required fields and a default "Open" status. | ~[2] day ([9] hrs) |
| **Job Posting UI** | Built the "Create Posting" form (`[/job-posting.html]`) with client-side validation, submission to the API, and return to the management page on success. | ~[2] day ([3] hrs) |
| **Recruiter Dashboard** | Built `[/recruiter-dashboard.html]` showing the recruiter's posted jobs with status and a "Close" action, and connected it to the backend. | ~[3] day ([21] hrs) |
| **Automated Test Suites** | Wrote Jest unit and integration tests (`tests/[jobs-posting.test.js]`) covering posting creation with all required fields, rejection of an empty Title, and closing a posting so it disappears from search. | ~[2] day ([6] hrs) |
| **Documentation & Issue Linking** | Created acceptance test issues, linked sub-issues to parent user stories, and contributed to the Sprint 2 Summary Report. | ~[1] day ([2] hrs) |

**Total Time Spent:** ~[11] Days (~[41] Hours)

---

## 3. Key Links to Artifacts

### Pull Requests

- [**PR #[05]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/6): `Recruiter Job Posting`
- [**PR #[24]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/47): `Recruiter Dashboard`

### User Stories & Tasks Completed

- [**US-[05]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/47): Recruiter Dashboard
- [**US-[24]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/6): Recruiter Job Posting / Create Job

### Acceptance Tests Issues

- [**Issue #[01]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/45): `[Test] Recruiter creates a posting with all required fields`
- [**Issue #[02]**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/46): `[Test] Recruiter closes a posting and it disappears from search`