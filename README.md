# Rolemate

Rolemate is an honest-first AI career assistant for students. It tailors resumes to a specific job description without inventing experience, skills, degrees, or certifications.

Its core product rule is the **Honest Friend Rule**:

- Never fabricate skills, jobs, degrees, or certifications.
- If the user is underqualified, say so directly and constructively.
- Ask targeted journalistic follow-up questions to uncover real adjacent experience.
- Only use original resume content or user-verified answers in rewrites.

## Stack

- Frontend: Next.js App Router + React + TailwindCSS
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma
- Auth: JWT email/password with HTTP-only cookies
- AI: OpenAI API through a single utility at [`src/server/api/openai.js`](./src/server/api/openai.js)
- Deployment target: Vercel

## Features

- PDF-only resume upload with a 5MB max size
- PDF text extraction with `pdf-parse`
- Manual text fallback for unreadable or image-based PDFs
- Job description ingestion with minimum-length validation
- AI-powered resume parsing into structured sections
- AI-powered job description analysis
- Mismatch matrix with direct matches, soft gaps, and hard gaps
- Weighted fit score with transparent breakdown
- Honest assessment that stays grounded in the source material
- Journalistic verification questions for hard gaps
- Truth-gated rewrites in `Strict`, `Suggestion`, and `Translation` modes
- Transparency log for every rewrite change
- Split preview with PDF download and copy-to-clipboard
- Anonymous 3-review limit with upgrade-to-free-account flow
- Authenticated review history dashboard
- Development logging and structured run summaries

## Project Structure

```text
api/[[...route]].js                  Vercel serverless catch-all for Express
server/app.js                        Express app
server/index.js                      Local API server entry
prisma/schema.prisma                 Database schema
src/app/                             Next.js routes
src/components/                      Frontend UI modules
src/server/api/openai.js             Single OpenAI utility
src/server/modules/                  Rolemate backend modules
src/server/prompts/                  All system prompts
src/server/routes/                   Express routes
```

## Required Environment Variables

Copy `.env.example` to `.env` and fill these in:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rolemate"
JWT_SECRET="replace-me"
COOKIE_SECRET="replace-me-too"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Run migrations:

```bash
npx prisma migrate dev
```

4. Start the app:

```bash
npm run dev
```

This runs:

- Next.js on `http://localhost:3000`
- Express on `http://localhost:4000`

## Deployment Notes

The repo is structured so the frontend can deploy to Vercel and the Express backend can run through the serverless catch-all at [`api/[[...route]].js`](./api/[[...route]].js).

Important production note:

- The current prototype persists uploaded PDFs to a local `uploads/` directory for development simplicity.
- For true production persistence on Vercel, swap that storage layer to Vercel Blob, S3, or another object store while keeping the existing `originalPdfPath` abstraction.

## Main API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/reviews`
- `GET /api/reviews/:id`
- `POST /api/reviews/:id/verification`
- `POST /api/reviews/:id/rewrite`
- `POST /api/reviews/improved/:id/decision`
- `GET /api/dashboard/history`
- `POST /api/feedback`

## Honesty Safeguards

- All AI calls go through [`src/server/api/openai.js`](./src/server/api/openai.js)
- All prompts live in [`src/server/prompts`](./src/server/prompts)
- Verification answers must be affirmative and factual before they can become suggested bullets
- `Suggestion` mode keeps new bullets pending until the user accepts them
- Transparency entries capture:
  - what changed
  - why it changed
  - which rewrite mode was active
  - whether it came from the original resume or a verified answer
- A rewrite self-check verifies:
  - no unsupported facts
  - no missing original experience entries
  - minimum 200-word output

## Observability

In development, Rolemate logs:

- Resume extraction result
- Job parsing summary
- Mismatch matrix output
- Fit score breakdown
- Verification questions and answers
- Rewrite mode and token usage
- Retry activity
- Structured run summary object

## Edge Cases Covered

- Empty or unreadable PDFs
- Image-based / scanned PDFs
- Oversized PDFs
- Short resumes
- Short job descriptions
- Duplicate submissions returning cached results
- Anonymous usage cap
- Retry-once behavior for slow or failing AI calls

## Scale Considerations

### Supporting millions of students in a Handshake-scale ecosystem

- Move uploads to object storage and put all analysis jobs on a queue so ingestion, parsing, verification-question generation, and rewriting can run asynchronously.
- Cache normalized resume/JD pairs aggressively with content hashes to avoid duplicate AI spend.
- Split the pipeline into independently scalable workers: ingestion, parsing, scoring, rewrite, and analytics.
- Store analysis artifacts in a document-friendly store or warehouse alongside PostgreSQL for cheaper longitudinal reporting.
- Add rate limiting, tenant-aware quotas, and per-school analytics partitions.

### Fine-tuning the Verification Agent over time

- Collect opt-in, anonymized verification chats labeled by career counselors or recruiters.
- Train on pairs of `hard gap -> high-quality interview question -> verified factual answer`.
- Learn which questions unlock real, resume-usable evidence without leading users into exaggeration.
- Use feedback loops from accepted vs. rejected suggested bullets.

### Incorporating recruiter feedback into the scoring engine

- Capture recruiter feedback about interview/no-interview outcomes and reasons.
- Reweight features using observed outcomes by role family, seniority band, and industry.
- Separate global scoring logic from school- or employer-specific models so fairness checks stay visible.

### Helping the rewrite engine learn from successful resumes

- Compare accepted rewrites against later interview outcomes.
- Learn which grounded phrasing changes improve callback rates for specific role clusters.
- Keep the constraint system hard: style can adapt, facts cannot.

### Enterprise version for university career centers

- Multi-tenant admin console for staff and schools
- Counselor review workflows and advisor notes
- Campus-wide analytics on common student gaps
- School-approved prompt packs and rubric templates
- CRM / ATS / Handshake integrations
- FERPA-aware permissions, audit trails, and institutional reporting

## Current Limitations

- The repo has been scaffolded for production-oriented structure, but it still needs dependency installation and a real PostgreSQL connection before it can be executed.
- Local PDF file persistence should be replaced with object storage for long-term Vercel production use.
- Because the current environment did not have `node` available on `PATH`, the app was not runtime-tested here.
