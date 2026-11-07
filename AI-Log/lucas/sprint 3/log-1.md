# AI LOG 1 (SPRINT 3)

Task: AI resume parsing & profile auto completion feature
Purpose of the AI: Code generation, guidance, and brainstorming for the feature implementation.
AI-suggested content: The AI generated code snippets, configurations, and suggestions.
Validation: Read through suggested code and configurations, checked them against requirements and project structure, and made necessary adjustments to ensure compatibility and functionality.
Reflection: The AI provided valuable insights and code suggestions, but careful review and adaptation were necessary to align with the project's specific needs and constraints.

## Prompt

I am working on an AI feature for a job platform website (for a course at university). I need some help setting this all up.

After extensive research this is what I have determined to be the best:
- Qwen 2.5-3B-Instruct for the model
- Running in a sidecar docker ollama container.
- The backend (Express) will then have controller/routes files to interface and interact with the ollama container.
As for what the AI will be doing:
- The backend sends an uploaded resume (pdf, docx) to the AI
- The AI processes the information and returns a structured JSON object with the following information
  - A list of skills with their proficiencies selected from a strict list (beginner, intermediate, advanced)
  - A structured job history with a company name, a position title, a start date, an end date, an is current bool (if the person is still working as that job), details on the job (plain text).
  - The AI should be precise, not hallucinate any skills or experience. It is better to have false negatives than false positives.
Additional info:
- We are already running a docker compose stack to run mysql.
- If required, we can extend the backend to use python if that makes the AI side of things easier, but if so, we must update the npm run configs to also automatically start the python backend.
Help me set this all up.

## Response:

