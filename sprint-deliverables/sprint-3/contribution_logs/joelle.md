# Individual Contribution Log – Sprint 3

**Name:** Joelle Al-Haddad
**Project:** CareerConnect – Job Search and Application Tracking Platform  
**Sprint:** Sprint 3 
**Repository:** [CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

---

## 1. Summary of Contributions

During Sprint 3, I was primarily responsible for implementing and testing **US-31: Application Analytics and History Dashboard**.

The objective of this user story was to provide job seekers with a dashboard that summarizes their job application activity and allows them to monitor their progress throughout the job search process.

My main contributions included:

- **Application Analytics Dashboard:** Designed and implemented a dashboard displaying the total number of submitted applications, applications under review, interviews, and offers received.
- **Monthly Application Activity Chart:** Implemented an Applications Over Time chart that groups submitted applications by month.
- **Application History Integration:** Integrated the analytics dashboard into the existing My Applications page while preserving the application history functionality.
- **Responsive Frontend Design:** Added CSS styling to organize the dashboard into a responsive layout that adapts to desktop, tablet, and mobile screen sizes.
- **Automated Testing:** Added four Jest tests to verify the presence and structure of the dashboard components.
- **Manual Acceptance Testing:** Created and completed three GitHub acceptance test issues covering the main dashboard functionality, empty application states, and responsive layouts.
- **Sprint Documentation:** Contributed to the Sprint 3 report, documented my individual contributions, and prepared AI usage logs describing development assistance and troubleshooting.

My implementation was submitted through **Pull Request #76**, which was successfully merged into the `development` branch.

---

## 2. Activity & Time Log

The following table summarizes my work during Sprint 3. Times are approximate estimates based on the scope of each task.

| Task / Feature Module | Description | Time Spent (Approx.) | Artifacts / Links |
|---|---|---|---|
| Application Analytics Dashboard | Implemented four statistics cards showing total applications, under-review applications, interviews, and offers. | 3 hours | US-31, Issue #80, PR #76 |
| Monthly Applications Chart | Added a chart displaying the number of job applications submitted per month. | 2 hours | Issue #80, PR #76 |
| Application History Integration | Integrated the dashboard with the existing My Applications page while preserving submitted application records and statuses. | 1.5 hours | Issue #80, PR #76 |
| Responsive CSS Design | Styled the statistics cards and chart to adapt to desktop, tablet, and mobile screen widths. | 2 hours | PR #76, Issue #85 |
| Automated Jest Testing | Created four automated tests in `tests/application-analytics.test.js` to verify dashboard structure and elements. | 2 hours | PR #76 |
| Main Dashboard Acceptance Testing | Tested application statistics, monthly chart, and application history using a submitted application. | 1 hour | Issue #78 |
| Empty Dashboard Acceptance Testing | Verified the dashboard using a job seeker account with zero submitted applications. | 1 hour | Issue #84 |
| Responsive Dashboard Acceptance Testing | Tested the dashboard at 1440px, 768px, and 375px using browser device emulation. | 2 hours | Issue #85 |
| Sprint Documentation & AI Usage Logs | Updated the Sprint 3 report and prepared individual contribution and AI usage logs. | 3.5 hours | Sprint 3 documentation |
| **Total** | | **18 hours** | |

**Total Time Spent:** Approximately 3 working days (18 hours).

---

## 3. My Testing 

### 3.1 Automated Jest Tests

I created the following test file:

`tests/application-analytics.test.js`

The file contains four automated Jest tests designed to verify that the expected analytics dashboard components are present.

These tests helped validate the dashboard structure and reduce the risk of accidentally removing important elements during development.


### 3.2 Acceptance Test – Main Dashboard

**Issue #78:** [Validate Application Analytics and History Dashboard](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/78)

I created an acceptance test to verify the main dashboard functionality.

The test covered:

- Displaying the total number of applications.
- Displaying application status counts.
- Displaying monthly application activity.
- Displaying existing application history.
- Confirming that the page loaded without errors.

I manually tested the dashboard using a submitted job application.


### 3.3 Acceptance Test – Empty Dashboard State

**Issue #84:** [AT-31.2 – Validate Empty State of Application Analytics Dashboard](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/84)

I created a separate acceptance test to verify how the dashboard behaves when a job seeker has not submitted any applications.

I logged in using a job seeker account with zero submitted applications and checked that:

- Total Applications displayed 0.
- Under Review displayed 0.
- Interviews displayed 0.
- Offers displayed 0.
- The monthly chart displayed an appropriate empty-state message.
- The application history indicated that no applications had been submitted.
- The page loaded without visible errors.


### 3.4 Acceptance Test – Responsive Dashboard

**Issue #85:** [AT-31.3 – Validate Responsive Application Analytics Dashboard](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/85)

I created a third acceptance test to verify the responsive design of the dashboard.

Using Chrome Developer Tools, I tested the dashboard at three different screen widths:

- Desktop: 1440px.
- Tablet: 768px.
- Mobile: 375px.

I performed visual checks using both an empty application dashboard and a dashboard containing a submitted application.

I verified that:

- Statistics cards adjusted to different screen widths.
- Text and statistics remained readable.
- The monthly chart displayed correctly.
- The application history remained accessible.
- No overlapping or cut-off dashboard elements were visible.

---

## 4. Links

### Pull Requests

- [PR #76 – Application Analytics and History Dashboard](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/pull/76) – Implemented and merged into `development`.

### User Stories & Tasks Completed

- [US-31 – Application Analytics and History Dashboard (Issue #80)](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/80)

### Acceptance Test Issues

- [Issue #78 – Validate Application Analytics and History Dashboard](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/78)
- [Issue #84 – AT-31.2: Validate Empty State of Application Analytics Dashboard](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/84)
- [Issue #85 – AT-31.3: Validate Responsive Application Analytics Dashboard](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform/issues/85)

### Other Contributions

- Added four automated Jest tests for the dashboard.
- Manually verified the dashboard with submitted and empty application data.
- Tested responsive layouts using browser device emulation.
- Contributed to the Sprint 3 report.
- Prepared AI usage logs documenting development and troubleshooting assistance.

---

## 5. AI Usage

During Sprint 3, I used ChatGPT as a development support tool.

AI assistance was primarily used for:

- Understanding existing JavaScript code.
- Troubleshooting local development issues.
- Understanding Docker and MySQL migration commands.
- CSS Grid and responsive layout concepts.

---

## 6. Sprint 3 

By the end of Sprint 3, I had successfully implemented and tested the Application Analytics and History Dashboard.

My completed work included:

- **1 completed user story:** US-31 (#80).
- **1 merged pull request:** PR #76.
- **3 completed acceptance test issues:** #78, #84, and #85.
- **4 passing Jest tests** for dashboard structure.
- **Responsive design verification** at desktop, tablet, and mobile widths.
- **completed my Sprint documentation and AI usage logs.**
