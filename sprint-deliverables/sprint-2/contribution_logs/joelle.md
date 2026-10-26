# Individual Contribution Log - Sprint 2
Joelle Al Haddad
Repository:[CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

1. Summary of Contributions

During Sprint 2, I was responsible for implementing the Job Search and Filtering feature (US-06) for the CareerConnect platform.

My contributions included:

- Developed the backend job search endpoint (`GET /api/jobs`) using Express and MySQL.
- Implemented keyword searching by job title, description, and company name.
- Added filtering by location and job type, including support for combining multiple filters.
- Built the job search frontend interface with search fields, job listings, and a helpful empty-results message.
- Performed manual testing to verify matching and non-matching job searches.
- Created 8 automated tests using Jest and Supertest to validate the job search API.
- Verified that all 97 project tests passed across 7 test suites.
- Created and organized acceptance test issues and development tasks under US-06.
- Submitted Pull Request #54 and requested a teammate review.

2. Activity & Time Log

Job Search Backend | Implemented the `GET /api/jobs` endpoint, SQL keyword searching, and location/job type filtering. | 5 hrs | [PR #54](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/54), [Task #57](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/57) |
Job Search Frontend | Created the job search page, filter inputs, results display, and no-results message. | 6 hrs | [PR #54](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/54), [Task #58](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/58) |
Manual Testing & Debugging | Tested keyword, location, and job type filters and verified that searches with no matching jobs displayed a helpful message. | 3 hrs | [PR #54](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/54) |
Automated Testing | Created `tests/job-search.test.js` with 8 automated API tests. Ran the complete test suite successfully: 97 tests passed. | 3 hrs | [Commit 9593150](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/commit/9593150), [AT #55](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/55), [AT #56](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/56) |
Documentation & GitHub Organization | Created acceptance test issues and development sub-issues, linked them to US-06, opened PR #54, and documented testing results. | 3 hrs | [US-06 #7](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/7), [PR #54](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/54) |

Total Time Spent: Approximately 20 hours

3. Key Links to Artifacts

Pull Requests

- [PR #54: Implement job search and filtering feature](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/54)

User Stories & Tasks

- [US-06 #7: Job search and filtering](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/7)
- [Task 6.1 #57: Implement job search and filtering backend](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/57)
- [Task 6.2 #58: Build job search interface and results display](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/58)

Acceptance Test Issues

- [AT-06.1 #55: Search returns matching job listings](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/55)
- [AT-06.2 #56: Search displays a message when no jobs match](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/56)

Automated Testing

- Test file: `tests/job-search.test.js`
- New automated tests: 8 passed
- Complete project test suite: 97 tests passed across 7 suites
