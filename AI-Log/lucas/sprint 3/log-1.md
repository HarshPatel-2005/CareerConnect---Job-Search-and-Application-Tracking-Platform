# AI LOG 1 (SPRINT 3)

Task: AI resume parsing & profile auto completion feature
Purpose of the AI: Code generation, guidance, and brainstorming for the feature implementation.
AI-suggested content: The AI generated code snippets, configurations, and suggestions.
Validation: Read through suggested code and configurations, checked them against requirements and project structure, and made necessary adjustments to ensure compatibility and functionality.
Reflection: The AI provided valuable insights and code suggestions, but careful review and adaptation were necessary to align with the project's specific needs and constraints.

## Prompt

I am working on an AI feature for a job platform website (for a course at university). I need some help setting this all up.

After extensive research this is what I have determined to be the best:

* Qwen 2.5-3B-Instruct for the model
* Running in a sidecar docker ollama container.
* The backend (Express) will then have controller/routes files to interface and interact with the ollama container.
As for what the AI will be doing:
* The backend sends an uploaded resume (pdf, docx) to the AI
* The AI processes the information and returns a structured JSON object with the following information
  * A list of skills with their proficiencies selected from a strict list (beginner, intermediate, advanced)
  * A structured job history with a company name, a position title, a start date, an end date, an is current bool (if the person is still working as that job), details on the job (plain text).
  * The AI should be precise, not hallucinate any skills or experience. It is better to have false negatives than false positives.
Additional info:
* We are already running a docker compose stack to run mysql.
* If required, we can extend the backend to use python if that makes the AI side of things easier, but if so, we must update the npm run configs to also automatically start the python backend.
Help me set this all up.

## Response

To set up your AI resume parser using **Qwen 2.5-3B-Instruct** running in a Docker sidecar Ollama container integrated directly with your Express (Node.js) backend and MySQL database, you don't actually need to introduce Python. Node.js can easily handle document text parsing (`pdf-parse`, `mammoth`) and communicate directly with Ollama using its native API or official JavaScript client package (`ollama`).

This complete, production-ready setup guide covers Docker configuration, text extraction, structured JSON parsing with zero-hallucination guardrails, and MySQL insertion.

---

### Step 1: Update Your `docker-compose.yml`

Add the Ollama sidecar container to your existing Docker Compose stack. This mounts a persistent volume so downloaded models aren't lost when containers restart.

```yaml
version: '3.8'

services:
  # Your existing MySQL service
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: job_platform
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  # New Ollama Sidecar Service
  ollama:
    image: ollama/ollama:latest
    container_name: ollama-sidecar
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  mysql_data:
  ollama_data:

```

Bring up your stack and pull the model inside the container:

```bash
docker compose up -d
docker exec -it ollama-sidecar ollama run qwen2.5:3b-instruct

```

---

### Step 2: Install Backend Dependencies

In your Express backend project directory, install the required packages for file uploads, text parsing, and Ollama communication:

```bash
npm install express multer pdf-parse mammoth ollama mysql2

```

---

### Step 3: Implement the Resume Parser Service (`services/resumeService.js`)

This service extracts text from uploaded PDF or Word files, builds a strict JSON schema prompt enforcing precision (preferring false negatives over false positives), and queries Ollama with `temperature: 0` for deterministic outputs.

```javascript
import ollama from 'ollama';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Define the strict JSON Schema for Ollama structured outputs
const resumeJsonSchema = {
  type: "object",
  properties: {
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          proficiency: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
        },
        required: ["name", "proficiency"]
      }
    },
    job_history: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          position_title: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string", nullable: true },
          is_current: { type: "boolean" },
          details: { type: "string" }
        },
        required: ["company_name", "position_title", "start_date", "is_current", "details"]
      }
    }
  },
  required: ["skills", "job_history"]
};

export async function parseResumeFile(fileBuffer, mimeType) {
  let extractedText = '';

  // 1. Extract text based on file type
  if (mimeType === 'application/pdf') {
    const parsedPdf = await pdfParse(fileBuffer);
    extractedText = parsedPdf.text;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    mimeType === 'application/msword'
  ) {
    const parsedDocx = await mammoth.extractRawText({ buffer: fileBuffer });
    extractedText = parsedDocx.value;
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
  }

  // 2. Query Qwen 2.5 3B via Ollama sidecar
  const systemPrompt = `You are a precise, conservative resume-parsing assistant. Your goal is to extract structured data strictly from the provided resume text. 
GUARDRAILS:
- Do NOT hallucinate, infer, or extrapolate any skills, companies, titles, or dates not explicitly written in the text.
- If data is ambiguous, missing, or unclear, omit it. False negatives are heavily preferred over false positives.
- Skill proficiencies must be strictly mapped to: "beginner", "intermediate", or "advanced" based on context clues (e.g., years of experience or explicit mentions). Default to "beginner" if unsure.`;

  const response = await ollama.chat({
    model: 'qwen2.5:3b-instruct',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract the structured resume data from the text below:\n\n${extractedText}` }
    ],
    format: resumeJsonSchema, // Forces Qwen to match the JSON Schema strictly
    options: {
      temperature: 0.0 // Zero temperature for maximum determinism and precision
    }
  });

  return JSON.parse(response.message.content);
}

```

---

### Step 4: Create Express Controller & Routes (`controllers/resumeController.js`)

Wire up an API endpoint that handles the file upload via `multer` (in memory storage), calls the AI service, and saves the parsed output into your MySQL database.

```javascript
import multer from 'multer';
import { parseResumeFile } from '../services/resumeService.js';
import db from '../config/db.js'; // Your mysql2 connection pool

const upload = multer({ storage: multer.memoryStorage() });

export const uploadAndParseResume = [
  upload.single('resume'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No resume file uploaded.' });
      }

      // Parse file using Qwen 2.5 via Ollama
      const parsedData = await parseResumeFile(req.file.buffer, req.file.mimetype);

      // Optional: Save structured details into MySQL
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // Example insertion logic for candidate profile / skills / jobs
        // const [result] = await connection.query('INSERT INTO candidates ...', [...]);

        await connection.commit();
        res.status(200).json({
          message: 'Resume parsed and saved successfully',
          data: parsedData
        });
      } catch (dbError) {
        await connection.rollback();
        throw dbError;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Resume processing error:', error);
      res.status(500).json({ error: 'Failed to process resume.', details: error.message });
    }
  }
];

```

Register the route in your main Express router (`routes/api.js`):

```javascript
import { Router } from 'express';
import { uploadAndParseResume } from '../controllers/resumeController.js';

const router = Router();
router.post('/parse-resume', uploadAndParseResume);

export default router;

```

---

### Summary of Architecture Benefits

* **Isolation:** Ollama runs seamlessly as an isolated sidecar container communicating via standard HTTP on port `11434`.
* **Zero Overhead:** Sticking entirely to Node.js avoids managing Python virtual environments, extra `npm run` concurrent process scripts, or cross-language IPC serialization layers.
* **Accuracy:** Enforcing Ollama's native JSON Schema validation combined with `temperature: 0` ensures Qwen 2.5-3B-Instruct strictly adheres to your required keys and proficiency enums without hallucinating unverified skills.
