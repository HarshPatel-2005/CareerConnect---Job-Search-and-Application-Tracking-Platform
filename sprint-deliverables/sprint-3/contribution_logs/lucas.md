# Individual Contribution Log - Sprint 2

**Name:** Lucas Gentil (40333425)

**Repository**: [CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

---

## 1. Summary of Contributions

During Sprint 3, I took primary ownership of generative AI features, database migration, and the 404 route handler:

- Designed and implemented **Generative AI Features** including a resume parser that extracts structured information from uploaded resumes and an AI-powered resume/job matching feedback feature.
- Migrated the database from **SQLite to MySQL** to unify the backend data storage and improve scalability.
- Implemented a **Working 404 Route Handler** that catches all invalid routes and redirects users to a custom 404 page with helpful navigation links.

---

## 2. Activity & Time Log

| Task / Feature Module | Description | Time Spent (approx) | Artifacts/Links |
| :--- | :--- | :--- | :--- |
| **AI Parsing** | Developped a resume parser that extracts structured information from uploaded resumes. | ~1 day (8 hrs) | [**PR #71**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/71), Issues [#67](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/67), [#68](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/68) |
| **SQLite to MySQL migration** | Migrated the stray SQLite database to MySQL to ensure proper backend data storage and scalability. | ~1 day (4 hrs) | [**PR #71**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/71), Issue [#70](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/70) |
| **404 Route Handler** | Implemented a working 404 route handler that catches all invalid routes and redirects users to a custom 404 page with helpful navigation links. | ~0.25 days (1 hr) | [**PR #77**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/77), Issues [#49](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/49), [#69](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/69) |
| **AI Resume/Job Matching** | Developing an AI-powered resume/job matching feature that provides feedback to users based on their resumes and job applications. | ~2 days (6 hrs) Not yet complete | Issues [#11](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/11), [#66](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/66), Branch: `feature/lucas/ai-resume-feedback` |

**Total Time Spent:** ~4.25 Days (~15 Hours)

---

## 3. Key Links to Artifacts

### Pull Requests

- [**PR #71**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/71): `Feature/lucas/ai resume parsing- #71` *(Closes #67, #68, #70)*
- [**PR #77**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/77): `Feature/lucas/404 route handler` *(Closes #49, #69)*

### User Stories & Tasks Completed

- [**US-26**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/49): US-Proper 404 Page
- [**US-27**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/67): AI Resume Parsing & Profile Auto-Population

### Acceptance Tests Issues

- [**Issue #69**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/69): `AT-26.1: Validate 404 Page`
- [**Issue #68**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/68): `AT-27.1: Verify Resume Extraction & Verification`

### Other Issues

- [**Issue #70**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/70): Refactor: Replace SQLite ResumeStore with MySQL to unify database architecture.
