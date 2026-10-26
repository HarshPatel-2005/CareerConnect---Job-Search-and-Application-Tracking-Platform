# AI Usage Log (Sprint 2)
Joelle Al Haddad

**Task:** Job Search and Filtering Feature (US-06)

**AI Tool Used:** ChatGPT

### Purpose of AI Use

I used ChatGPT as a supplementary tool for technical clarification, automated testing assistance, and GitHub documentation.

### Prompts Submitted

My interactions included requests for:
- Guidance on writing Jest and Supertest tests for the existing job search API.
- Clarification of GitHub issue organization and acceptance tests.

### AI Suggested Content

ChatGPT suggested automated test cases for keyword searching, location and job type filtering, combined filters, empty results, and error handling. It also provided example test code and suggestions for organizing GitHub issues and documentation.

### Decision

I incorporated the suggested automated tests into the existing project structure and verified their compatibility with my implementation.

I retained the project's existing job search endpoint and filtering logic. I also reviewed the documentation suggestions and organized the relevant GitHub issues.

### Validation

I manually tested the job search interface and verified that the filters and empty-results behavior worked as expected.

I ran the automated job search tests (**8 passed**) and the complete project test suite (**97 passed**). The GitHub Actions checks also passed on Pull Request #54.

### Reflection

AI assistance was useful for understanding testing conventions and GitHub workflows. The final feature was validated through manual testing, automated tests, and CI checks.
