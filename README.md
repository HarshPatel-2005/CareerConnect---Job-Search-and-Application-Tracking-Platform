# CareerConnect

**A job search and application tracking platform for job seekers and recruiters.**

SOEN 341 Software Process, Fall 2026 | Concordia University

From: Joelle, Lucas, Harsh, Maz

GitHub Repository: [https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform.git]

---

## Table of Contents

1. [Project Description](#project-description)
2. [Identified Problem](#identified-problem)
3. [Proposed Solution](#proposed-solution)
4. [Team Members](#team-members)
5. [Technologies](#technologies)
6. [Proposed Features](#proposed-features)
7. [Setup Instructions](#setup-instructions)
8. [Repository Structure](#repository-structure)
9. [Team Process](#team-process)
10. [Project Management](#project-management)
11. [Generative AI Usage](#generative-ai-usage)

---

## Project Description

CareerConnect is a web-based platform that helps job seekers manage their entire job search in one place. Users can create a profile, upload and manage resumes, search and filter job postings, submit applications, and track the progress of each application. Recruiters can post and manage job openings and review applicants.

The platform is developed over four sprints using Agile practices, GitHub-based collaboration, testing, and continuous integration.

Primary users: Job Seekers and Recruiters.

---

## Identified Problem

Job seekers often apply to many positions across different websites, email threads, and company portals. Information ends up scattered: which resume version was sent, when the application was submitted, whether an interview was scheduled, and when the next deadline is. This makes it easy to miss deadlines, lose track of application statuses, and send the wrong resume to the wrong employer.

Recruiters face a related problem: receiving applications in inconsistent formats and having no simple, central way to manage postings and applicants.

---

## Proposed Solution

CareerConnect centralizes job-search activity into a single application:

- Job seekers keep their profile, resumes, saved jobs, and applications in one dashboard.
- Each application has a clear status (Applied, Interview, Offered, Rejected) so progress is always visible.
- Reminders and notifications warn users about upcoming deadlines.
- Recruiters get a dedicated way to publish job postings and receive applications.
- Generative AI features provide resume feedback and/or job-matching suggestions to help users improve their applications.

---

## Team Members

| Name | Student ID | GitHub Username |

| [Lucas] | [ID] | [@username] |

| [Joelle] | [ID] | [@username] |

| [Maz] | [ID] | [@username] |

| [Harsh] | [40341498] | [@HarshPatel-2005] |

---

## Technologies

| Area | Technology |

| Frontend | |

| Backend | |

| Database | |

| Authentication | |

| Generative AI | |

| Continuous Integration | GitHub Actions |

| Version Control | Git and GitHub |

| Project Management | GitHub Issues and GitHub Projects |

---

## Proposed Features

### Core Features

- **User registration, authentication, and profile management:** create an account, log in, and edit a personal profile.
- **Resume upload and management:** upload, view, replace, and delete resumes.
- **Job posting management (recruiters):** create, edit, and remove job postings.
- **Job search and filtering:** search postings and filter by criteria such as title, location, and job type.
- **Job application submission:** apply to a posting with a chosen resume.
- **Application status tracking:** mark each application as Applied, Interview, Offered, or Rejected.
- **Application history dashboard:** view all past and current applications in one place.
- **Notifications and reminders:** alerts for application deadlines.
- **Saved jobs and favourites:** bookmark postings to review later.

### Generative AI Feature (required)

- 

### Additional Original Feature

- 

### Sprint 1 Scope

The two features implemented and demonstrated in Sprint 1 are:

1. User registration and login
2. [Resume upload / User profile management]

---

## Setup Instructions

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [Database software]

### Installation

### Running the Application

### Running Tests

```bash
npm test
```

---

## Repository Structure

```
CareerConnect/
- README.md
- docs/                   Project documentation and team process
- meeting-minutes/        Minutes for every team meeting
- sprint-deliverables/    Deliverables for each sprint
- AI_Log/                 AI usage reports, one subfolder per team member
- frontend/               Client application code
- backend/                Server application code
```

---

## Team Process

Full details are in [`docs/team-process.md`](docs/team-process.md). 

Summary:



---

## Project Management

- **User stories and tasks:** tracked as GitHub Issues with labels.
- **Sprint board:** GitHub Projects (Kanban board).
- **Meeting minutes:** stored in [`meeting-minutes/`](meeting-minutes/).
- **Sprint plans:** stored in [`sprint-deliverables/`](sprint-deliverables/).

---

## Generative AI Usage

Our team uses Generative AI responsibly to support software engineering activities. All AI-generated content is reviewed, validated, and documented by the team.

- Each member keeps a PDF log of their AI usage in `AI_Log/<member-name>/`.
- Each log entry records the task, purpose, prompt and response (or chat link), AI-suggested content, validation performed, our decision (accepted, modified, or rejected), a reflection, and the responsible person.
- AI-generated user stories and team-generated user stories are documented separately and are never mixed.