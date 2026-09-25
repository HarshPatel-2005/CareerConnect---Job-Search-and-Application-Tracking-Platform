# Authentication API

## Register User

`POST /api/auth/register`

Registers a new user. Supports creating standard Job Seeker, or Recruiters (who can either create a new company or join an existing one via invite code).

**Request Body (Job Seeker):**

```json
{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "role": "job_seeker"
}
```

**Request Body (Recruiter - New Company):**

```json
{
    "full_name": "Alice Recruiter",
    "email": "alice@techcorp.com",
    "password": "Password123!",
    "role": "recruiter",
    "company_name": "TechCorp"
}
```

**Request Body (Recruiter - Joining via Invite Code):**

```json
{
    "full_name": "Bob Recruiter",
    "email": "bob@techcorp.com",
    "password": "Password123!",
    "role": "recruiter",
    "invite_code": "VALID-CODE-123"
}
```

**Responses:**

- `201 Created`: User registered successfully. Returns ``{"message": "User registered successfully", "userId": <user_id>, "companyId": <company_id>}``. (`companyId` is only returned for recruiters).
- `400 Bad Request`: Missing required fields or invalid invite code.
- `409 Conflict`: Email already in use, or Recruiter trying to create a company that already exists.

## Environment Variables (`.env`)

Available environment variables for the API:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=careerconnect
```

*You can also find these in the [.env.example](../../.env.example) file.*