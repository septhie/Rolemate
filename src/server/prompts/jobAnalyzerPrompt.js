const { honestFriendRule } = require("./sharedPromptRules");

function buildJobAnalyzerPrompt() {
  return `
${honestFriendRule}

Analyze the job description and return JSON with:
- requiredSkills: string[]
- preferredSkills: string[]
- experienceLevel: "entry" | "mid" | "senior"
- keyResponsibilities: string[]
- industryKeywords: string[]
- toneSignals: { style: string, evidence: string[] }
- minimumQualifications: string[]

Rules:
- Infer experience level from the language used.
- Separate hard requirements from preferences.
- Include only grounded keywords and responsibilities from the job description.
- Return JSON only.
`.trim();
}

module.exports = {
  buildJobAnalyzerPrompt
};

