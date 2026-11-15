const fs = require('fs');
const path = require('path');
const { PDFParse } = require("pdf-parse");
const mammoth = require('mammoth');
const ollama = require('ollama').default;

// Strict JSON Schema for Ollama structured output
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
                    title: { type: "string" },
                    start_date: { type: "string"},
                    end_date: { type: "string", nullable: true },
                    is_current: { type: "boolean" },
                    details: { type: "string", nullable: true }
                },
                required: ["company_name", "title", "start_date", "is_current"]
            }
        }
    },
    required: ["skills", "job_history"]
}

const feedbackJsonSchema = {
    type: "object",
    properties: {
        strengths: {
            type: "array",
            items: { type: "string" }
        },
        missing_skills: {
            type: "array",
            items: { type: "string" }
        },
        suggestions: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: ["strengths", "missing_skills", "suggestions"]
}

async function extractTextFromResume(fileBuffer, fileType) {
    if (fileType === 'application/pdf') {
        const parser = new PDFParse({ data: fileBuffer });
        try { return (await parser.getText()).text; }
        finally { await parser.destroy(); }
    }
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || fileType === 'application/msword') {
        return (await mammoth.extractRawText({ buffer: fileBuffer })).value;
    }
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
}

async function parseResumeWithAI(filePath, fileType) {
    const fileBuffer = await fs.promises.readFile(filePath);
    const extractedText = await extractTextFromResume(fileBuffer, fileType);

    // AI Query to Ollama sidecar
    const systemPrompt = `You are a precise, conservative resume-parsing assistant. Your goal is to extract structured data strictly from the provided resume text.
    Guardrails:
    - Do NOT hallucinate, infer, extrapolate, or make assumptions on any skills, companies, job titles, dates, or details not explicitly written in the text.
    - If data is ambiguous, missing, or unclear omit it. False negatives are heavily preferred over false positives.
    - Skill proficiencies must be strictly mapped to "beginner", "intermediate", or "advanced" based on context clues (e.g., years of experience or explicit mentions). Default to "beginner" if no clear indication is present.
    - Dates must be in "yyyy-MM-dd" format. If only a year is present, use "yyyy-01-01". If a month and year are present, use "yyyy-MM-01". If no year is present, omit the date. If a job is currently held, set "is_current" to true and "end_date" to null, do NOT set "end_date" to a specific date or "present".`

    const response = await ollama.chat({
        model: 'qwen2.5:3b-instruct',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extract the structured resume data from the text below:\n\n${extractedText}` }
        ],
        format: resumeJsonSchema,
        options: {
            temperature: 0.0,
        }
    });

    return JSON.parse(response.message.content);
}

function parseRequiredSkills(raw) {
    let value = raw;
    if (typeof value === 'string') {
        try { value = JSON.parse(value); } catch { return []; }
    }
    if (!Array.isArray(value)) return [];
    return value.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());
}

async function generateJobFeedback({ jobId, userId, resumeId, store, uploadDir, db }) {
    // Fetch job posting and requirements from MySQL
    const [jobs] = await db.query('SELECT id, title, description, status, required_skills FROM jobs WHERE id = ?', [jobId]);
    if (!jobs || jobs.length === 0) {
        throw new Error('JOB_NOT_FOUND');
    }
    const job = jobs[0];
    if (job.status !== 'open') {
        throw new Error('JOB_NOT_OPEN');
    }

    // Fetch user profile (skills & experience) 
    const requiredSkills = parseRequiredSkills(job.required_skills);
    if (requiredSkills.length === 0) {
        throw new Error('JOB_MISSING_REQUIRED_SKILLS');
    }

    const [skills] = await db.query('SELECT name, level FROM skills WHERE user_id = ?', [userId]);
    const [experience] = await db.query('SELECT company_name, title, start_date, end_date, is_current, details FROM experiences WHERE user_id = ? ORDER BY is_current DESC, start_date DESC', [userId]);

    // Fetch selected resume
    const resumeRecord = await store.get(resumeId, userId);
    if (!resumeRecord) {
        throw new Error('RESUME_NOT_FOUND');
    }

    // extract text from resume
    const filePath = path.join(uploadDir, resumeRecord.stored_name);
    if (!fs.existsSync(filePath)) {
        throw new Error('RESUME_FILE_MISSING');
    }

    const resumeBuffer = fs.readFileSync(filePath);
    const resumeText = await extractTextFromResume(resumeBuffer, resumeRecord.mime_type);

    const promptPayload = {
        jobPosting: {
            title: job.title,
            description: job.description,
            required_skills: requiredSkills
        },
        candidateProfile: {
            skills: (skills || []),
            jobHistory: (experience || [])
        },
        selectedResumeText: resumeText
    };

    const systemPrompt = `You are a precise, conservative, expert technical recruiter and career coach. Your goal is to compare and analyze the candidate's profile and selected resume against the job posting's requirements. 
    You must provide non-hallucinated actionable feedback strictly based on the provided data.
    Guardrails:
    - Do NOT hallucinate, infer, extrapolate, or make assumptions on any skills, companies, job titles, dates, or details not explicitly written in the provided data.
    - If data is ambiguous, missing, or unclear omit it. False negatives are heavily preferred over false positives.`

    // Call Ollama API for feedback generation
    const aiResponse = await ollama.chat({
        model: 'qwen2.5:3b-instruct',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Provide feedback on the candidate's resume using the following data:\n\n${JSON.stringify(promptPayload)}` }
        ],
        format: feedbackJsonSchema,
        options: {
            temperature: 0.0,
        }
    });

    return JSON.parse(aiResponse.message.content);
}

module.exports = { parseResumeWithAI, generateJobFeedback, parseRequiredSkills };