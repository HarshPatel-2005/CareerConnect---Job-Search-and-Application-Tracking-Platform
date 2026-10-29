# Sprint 2 Submission Report

Course: SOEN 341: Software Process | Term: Fall 2026

Repository: [CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

Team Members: Lucas, Joelle, Maz, Harsh

## 1. Sprint Objectives

The primary objective of Sprint 2 was to advance the CareerConnect platform by establishing secure full-stack authentication, delivering user profile and resume management, implementing core job search and application tracking features, setting up continuous integration, and enforcing strict user data isolation.

## 2. Features and Functionality Implemented

- **End-to-end JWT Authentication & Security**: Integrated JWT issuance into login and registration endpoints, implemented backend authentication middleware, and secured client-side token persistence.
- **User Profile & Resume Lifecycle management**: Developed a complete profile management dashboard supporting profile summaries, interactive work experience timelines, pill-tag skill suites, and resume file upload, replacement, download, and deletion.
- **Smart Route Protection & Navigation**: Refactored global site navigation, including dynamic profile links, direct post-authentication redirects, and client-side guards preventing authenticated users from accessing login pages.
- **CI/CD Automation Pipeline**: Configured a GitHub Actions workflow that automatically executes Jest integration and unit test suites on every pull request to ensure high code quality and prevent regressions.
- **Job Search and Filtering:** Implemented a job search interface and backend API allowing users to search available jobs by keyword and filter by location and job type. Added support for combined filters, matching job listings, and a helpful message when no jobs match. Created 8 automated tests to validate the search API.

## 3. Team Innovation & Original Features

- **Public/Owner Interactive Profile Dashboard**: Designed a flexible profile system accessible to platform users while restricting edit controls and resume management strictly to the authenticated owner.
- **Modular Design System Architecture**: Re-architected frontend styles into a scalable CSS system (`base/`, `layouts/`, `components/`, `pages/`), harmonizing color tokens, typography, and responsive layouts across all existing and new pages.
- **Multi-User File Isolation**: Enforced strict ownership validation across all resume and profile endpoints, preventing unauthorized cross-user access attempts (`403 Forbidden`).

## 4. Challenges and Resolutions

- **Challenge**: Handling token expiration and seamless state synchronization across independent frontend pages.
  - **Resolution**: Implemented global HTTP response interceptors in frontend fetch calls to catch 401/403 status codes, automatically clearing stale tokens and redirecting unauthenticated users to login.
- **Challenge**: Maintaining CSS consistency across fast-iterating feature pages built by different team members.
  - **Resolution**: Refactored fragmented inline styles into a standardized tokenized CSS component library (`variables.css`, `cards.css`, `buttons.css`).

## 5. Team Contributions Summary

- Lucas: Implemented end-to-end JWT auth middleware, security isolation, complete profile CRUD controllers, unified profile frontend dashboard, modular CSS redesign, and the GitHub Actions CI automated testing pipeline.
- Joelle: Implemented the Job Search and Filtering feature, including the Express/MySQL search API, keyword and location/job type filters, and frontend job listings interface. Created 8 automated Jest/Supertest tests, verified all 97 project tests passed.
- Harsh: Designed and implemented the Recruiter Dashboard, Implemented Job Posting Management, Implemented posting closure,
- Maz: Designed and implemented end-to-end routes for all the CRUD operations needed to post and retrieve a job posting as well as applying and changing the status of said job posting. Created the different application table linking users, jobs and resumes (US-07)
