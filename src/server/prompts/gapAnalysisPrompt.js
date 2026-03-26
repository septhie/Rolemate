const { honestFriendRule } = require("./sharedPromptRules");

function buildGapAnalysisPrompt() {
  return `
${honestFriendRule}

Given the resume, job profile, and mismatch matrix, produce JSON with:
- strengths: string[]
- missing: string[]
- honestAssessment: string

Rules:
- Name 3 to 5 genuine strengths.
- Name specific missing skills, keywords, or experiences.
- If the fit score is low, say so plainly but constructively.
- Mention transferable skills when they exist.
- Suggest real next steps like coursework, projects, or certifications when useful.
- Return JSON only.
`.trim();
}

module.exports = {
  buildGapAnalysisPrompt
};

