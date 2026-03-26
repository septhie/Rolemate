const { honestFriendRule } = require("./sharedPromptRules");

function buildResumeParserPrompt() {
  return `
${honestFriendRule}

Parse the resume text into structured JSON with these keys:
- contactInfo: { name, email, phone, location, links: string[] }
- summary: string
- workExperience: [{ role, company, location, dates, bullets: string[] }]
- education: [{ school, degree, location, dates, bullets: string[] }]
- skills: string[]
- projects: [{ name, context, bullets: string[] }]
- extracurriculars: [{ name, role, bullets: string[] }]
- certifications: string[]
- flags: { missingCriticalSections: string[], sparseSections: string[], warnings: string[] }

Rules:
- If information is missing, return empty strings or empty arrays.
- Detect sparse sections when an experience, project, or education entry has only one bullet or no bullets.
- Do not hallucinate structure beyond what the text supports.
- Return JSON only.
`.trim();
}

module.exports = {
  buildResumeParserPrompt
};

