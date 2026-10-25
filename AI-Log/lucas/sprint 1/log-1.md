# AI Usage Log Sprint 1

*Please Take Note:* The AI chat logs were too long to export in their entirety, so I have tried to provide a comprehensive summary of my AI usage throughout this sprint. While I could not include every single prompt and response, I have attempted to replicate the general idea of the conversation as accurately as possible.

**Team Member:** Lucas Gentil (40333425)

## Task: Express Server Architecture & CI/CD Pipeline Setup (Issue #4)

**Purpose of AI Use**: Code generation, system architecture guidance, and CI/CD workflow structuring.

**Prompt/Response**: Collaborated with AI to design a robust base architecture for an Express app that will handle user authentication, job postings, and resume uploads, and GitHub Actions CI/CD workflow.

**AI-Suggested Content**: Recommended splitting the Express configuration (`src/api/app.js`) from the port listener (`src/api/server.js`) to prevent port-locking issues during automated testing, alongside a GitHub Actions YAML configuration for running automated Jest tests on pull requests to the `development` branch.

**Validation**: Verified the seperation by running Supertest and Jest unit tests (`npm test`) locally, and checked CI build execution when pushing to GitHub.

**Decision**: Accepted the AI-suggested architecture and CI/CD workflow structure, with minor adjustments to fit project structure.

**Reflection**: The AI provided a solid starting point for the project architecture and CI/CD pipeline, which helped streamline the development process. The separation of concerns in the Express app improved maintainability and testability.

**Responsible Person**: Lucas Gentil

## Task: User & Recruiter Registration Implementation & Docker MySQl Setup (Issues #1, #20, #21)

**Purpose of AI Use**: System design, database schema planning, backend controller logic, and debugging authentication flows.

**Prompt/Response**: Collaborated with AI to design the user and recruiter registration flows, including database schema for users and companies, and the necessary backend controller logic to handle registration requests. AI also assisted in debugging issues related to MySQL Docker container setup and connection errors.

**AI-Suggested Content**: Generated SQL initialization script, docker-compose configuration for local MySQL container, and Express route handlers for user and recruiter registration logic handling three distinct registration paths (job seeker, company creation, and recruiter joining via invite code).

**Validation**: Tested database container boot using Docker Compose, verified password hashing via database inspection, and ran all Jest unit tests suites validating HTTP responses.

**Decision**: Accepted with significant required modifications to the AI generated code to remove hallucinations and incorrect assumptions about the project structure and requirements.

**Reflection**: AI helped accelerate the development process by providing a starting point for the registration logic and database schema, but it still required a lot of manual review, debugging, and adjustments to align with the actual project requirements and structure. This was especially the case with designing the MySQL database schema and ensuring the correct handling of recruiter registration flows.

**Responsible Person**: Lucas Gentil

## Task: Sprint 1 Documentation, README & Team Process Refinement

**Purpose of AI Use**: Documentation editing

**Prompt/Response**: Collaborated with AI to refine and restructure the project README slightly, and to ensure that the team process was clearly documented and easy to follow. The AI also assisted in writing a concise summary of its usage (reflected in this log).

**AI-Suggested Content**: Rewrote team-process to better align with standard Agile practices, refine the definitions of "Ready" and "done", and to reflect the team's Git workflow.

**Validation**: Cross-checked the AI-suggested content with the actual team process, as well as the course's grading rubric to ensure compliance with the project requirements.

**Decision**: Accepted with some slight modifications to ensure clarity and alignment with the actual team process.

**Reflection**: The AI was quite good at self-documenting its usage, especially given the long conversation history. Though it still made a couple of minor errors that required manual review and correction, it was a useful tool for quickly generating documentation content.

**Responsible Person**: Lucas Gentil

## Appendix

Here is a link to the AI chat log for this sprint: [AI Chat Log](https://share.gemini.google/KegC4L5GeDUT). The chat history is quite long, so it may take a while to load or may not load at all.
