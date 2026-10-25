# Individual Contribution Log - Sprint 2

**Name:** Lucas Gentil (40333425)

**Repository**: [CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

---

## 1. Summary of Contributions

During Sprint 2, I took primary ownership of the core security, authentication, and user profile/resume infrastructure:

- Designed and implemented end-to-end **JWT Authentication & Authorization** across backend controllers and frontend client state.
- Implemented **User Profile & Resume Lifecycle Management** (US-19, US-20, US-21, US-22, US-23).
- Engineered **Multi-User File Isolation** enforcing strict owner-only edit/delete rights and 403 Forbidden checks on cross-user resource attempts.
- Re-architected the application's frontend styling into a **Modular CSS Design System** to standardize UI components across all pages.
- Configured and deployed the **GitHub Actions CI Pipeline** (`.github/workflows/test.yml`) to automatically execute test suites on every Pull Request.
- Authored comprehensive Jest integration/unit test suites covering auth, profile, and resume lifecycles.

---

## 2. Activity & Time Log

| Task / Feature Module | Description | Time Spent (approx) | Artifacts/Links |
| :--- | :--- | :--- | :--- |
| **JWT Authentication & Auth Middleware** | Designed JWT helper, updated `/api/auth/register` and `/api/auth/login` to return signed tokens, created `authenticateToken` backend middleware, and integrated client-side token persistence & auto-redirects. | ~1 day (10 hrs) | [**PR #44**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/44), Issues [#39](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/39), [#40](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/40) |
| **Profile & Resume Lifecycle Controllers** | Developed profile backend CRUD APIs, resume file upload/replace/download/delete pipelines, file MIME-type & size limits (5 MB max), and multi-user ownership authorization validation. | ~1 day (7 hrs) | [**PR #44**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/44), Issue [#42](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/42) |
| **Automated Test Suites & CI Setup** | Wrote Jest unit and integration tests (`tests/auth.test.js`, `tests/profile.test.js`, `tests/resume.test.js`) and created the GitHub Actions workflow (`.github/workflows/ci.yml`) to run tests automatically on pull requests. | ~1 day (10 hrs) | [**PR #44**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/44), Issues [#33](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/33), [#34](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/34), [#35](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/35) |
| **Modular CSS Design System Overhaul** | Restructured `public/css` into a modular architecture (`variables.css`, `grid.css`, `cards.css`, `buttons.css`, etc.) and harmonized styling, typography, and responsive layouts across all existing application pages. | ~1 day (7 hrs) | [**PR #48**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/48), Issue [#30](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/30) |
| **Consolidated Profile Dashboard UI** | Built unified profile UI (`/profile.html`) with public view vs. owner edit controls, company-grouped work experience modal form, skill tags suite, resume table, and global navbar integration. | ~2.5 day (25 hrs) | [**PR #50**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/50), Issue [#43](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/43) |
| **Documentation & Issue Linking** | Created acceptance test issues, linked sub-issues to parent user stories, maintained task tracking, and drafted the Sprint 2 Summary Report. | ~0.25 day (3 hrs) | Sprint 2 Report, Issues [#33](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/33), [#34](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/34), [#35](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/35), [#51](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/51) |

**Total Time Spent:** ~6.75 Days (~62 Hours)

---

## 3. Key Links to Artifacts

### Pull Requests

- [**PR #44**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/44): `feat(auth): integrate end-to-end JWT authentication, route protection, and user resume isolation` *(Closes #39, #40, #41, #42, #33, #34, #35)*
- [**PR #48**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/48): `Refactor frontend into a modular, cohesive design system` *(Closes #30)*
- [**PR #50**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/50): `Feature/lucas/profile view` *(Closes #43)*

### User Stories & Tasks Completed

- [**US-17**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/30): Cohesive Frontend
- [**US-19**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/39): Integrate JWT Issuance into Existing Auth Endpoints
- [**US-20**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/40): Implement JWT Auth Middleware & Client State
- [**US-21**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/41): Wire Existing Profile Endpoints & UI to JWT Context
- [**US-22**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/42): User-Linked Resume Upload & Lifecycle
- [**US-23**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/43): Consolidated Profile & Resume Summary View

### Acceptance Tests Issues

- [**Issue #33**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/33): `[Test] Write tests for login route`
- [**Issue #34**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/34): `[Test] Write tests for resume upload & management`
- [**Issue #35**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/35): `[Test] Write Tests for user profile management`
- [**Issue #51**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/51): `[Test] Acceptance Tests: Consolidated Profile & Resume Summary View (US-23)`
