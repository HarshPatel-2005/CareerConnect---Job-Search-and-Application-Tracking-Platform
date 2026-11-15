# Sprint 3 Submission Report

Course: SOEN 341: Software Process | Term: Fall 2026

Repository: [CareerConnect Repository](https://github.com/HarshPatel-2005/CareerConnect---Job-Search-and-Application-Tracking-Platform)

Team Members: Lucas, Joelle, Maz, Harsh

## 1. Sprint Objectives

The primary objective of Sprint 3 was to complete the remaining core functionalities of the CareerConnect platform all while strengthening the software quality through rigorous testing and CI/CD automation. The main new feature to be implemented was the required Generative AI powered feature.

## 2. Features and Functionality Implemented

- **Recruiter Dashboard & Posting Management**: Started in sprint 2, and completed in this sprint, the recruiter dashboard allows recruiters to create, edit and manage their job postings.
- **Application Analytics & History Dashboard**: Allows job seekers to get a quick dashboard view of their application history and the status of each of their current applications as well as some job search metrics.
- **Notification & Reminders**: A new feature that notifies users (in app) for application updates such as status changes, interview invites and more, along with reminders for upcoming interviews and application deadlines.
- **AI feature**: Two AI featuers were started and partially implemented in this sprint. The first is a resume parser that extracts structured information from uploaded resumes and stores it in the database and profile. The second is an AI powered resume/job matching feedback feature that allows users to get feedback on their resume and how well it matches a specific job posting.

## 3. Team Innovation & Original Features

- **AI parser for resumes**: Designed a generative AI model usage that automatically processes and extracts key information from uploaded resumes and populates the user's profile with them for further analytical metrics such as job compatibility and general platform ease of use.
- **Working 404 Route Handler**: Implemented a fully functional 404 route handler that catches all invalid routes and redirects users to a custom 404 page with helpful navigation links.

## 4. Challenges and Resolutions

- **Challenge**: Handling AI integration and ensuring minimal model hallucinations.
  - **Resolution**: Implemented strict prompt engineering and validation checks to ensure the AI only returns structured data that matches the expected schema. Additionally, implemented a review process for AI-generated outputs before they are stored in the database so that users may verify the accuracy of the information.

## 5. Team Contributions Summary

- Lucas: Implemented the generative AI features, including the resume parser and job matching feedback feature. Migrated random sqlite database to mysql. Created the 404 route handler.
- Joelle: 
- Harsh: Implemented the archive and restore feature for job postings, including the Archived tab, the archive API, and hiding archived postings from the dashboard, job search, and job seekers' application lists. Built the candidate review rule that closes a job and rejects the remaining pending applications once its openings are filled. Fixed the job status dropdown on the recruiter dashboard. Wrote and updated the Jest tests for these features, along with the user stories, acceptance tests, and contribution log.
- Maz:
