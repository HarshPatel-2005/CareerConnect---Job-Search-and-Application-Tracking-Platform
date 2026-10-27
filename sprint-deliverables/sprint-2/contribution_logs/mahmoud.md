# Individual Contribution Log - Sprint 2

**Name:** Mahmoud Maz (40328977)

**Repository**: [CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

---

## 1. Summary of Contributions

During Sprint 2, I took primary ownership of the workflow for the job application submission from posting the job listing all the way until an applicant decides to apply to it :

- Designed and implemented end-to-end routes for all the CRUD operations needed to post and retrieve a job posting as well as applying and changing the status of said job posting.
- Created the different application table linking users, jobs and resumes (US-07)
- Engineered the apply endpoint to be atomic to avoid any races conditions that might arise if two people decide to apply to the same listing which would result in an error otherwise. 
- Authored comprehensive Jest integration/unit test suites for the feature of job application submission and the posting of it as well

---

## 2. Activity & Time Log


| **Task 7.1: Create applications table linking users, jobs, and resumes #59** | Created the MySQL application tables that connects the user, job and resume all in one neat table. There is an automatic timestamp when there is a submission and there is no duplicates allowed | (5 hrs) | [**PR #65**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/65), Issues [#59](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/59)
| **Task 7.2: Implement the apply endpoint #60** | Implemented POST /api/jobs/:id/apply which with proper authentication and job-seeker validation, resume ownership and jobs with open status lets people to apply to a job posting. Integration tests were also made for this feature| (8 hrs) | [**PR #65**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/65), Issue [#60](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/60) |
| **Task 7.3: Add the Apply flow to the job details page #61** | Connected job search results with job details that retains resume submitted with a timesptamped confirmation. Errors states were also introduced to make this system fail gracefully. | (10 hrs) | [**PR #65**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/65), Issues [#61](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/61)


**Time Spent:** 23 hours

---

## 3. Key Links to Artifacts

### Pull Requests

- [**PR #65**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/65): 

### User Stories & Tasks Completed

- [**US-07**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/8): Main user story
- [**Task 7.1**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/59): Create applications table linking users, jobs, and resumes 
- [**Task 7.2**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/60):       Implement the apply endpoint #60
- [**Task 7.3**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/61): 
Add the Apply flow to the job details page #61


### Acceptance Tests Issues

- [**Issue #33**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/33): `[Test] Write tests for login route`
- [**Issue #34**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/34): `[Test] Write tests for resume upload & management`
- [**Issue #35**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/35): `[Test] Write Tests for user profile management`
- [**Issue #51**](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/51): `[Test] Acceptance Tests: Consolidated Profile & Resume Summary View (US-23)`

**Automated Testing**

- Test file: `tests/applications.test.js`
- Complete project test suite: 55 tests passed across 7 suites