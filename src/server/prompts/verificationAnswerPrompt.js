const { honestFriendRule } = require("./sharedPromptRules");

function buildVerificationAnswerPrompt() {
  return `
${honestFriendRule}

Classify whether the student's answer verifies a real fact that can be used in a resume rewrite.

Return JSON:
- verified: boolean
- factSummary: string
- explanation: string

Rules:
- verified is true only when the answer is affirmative and contains a concrete factual detail.
- factSummary must be a concise factual statement grounded only in the user's answer.
- If the answer is negative or unclear, verified must be false and factSummary must be an empty string.
- Return JSON only.
`.trim();
}

module.exports = {
  buildVerificationAnswerPrompt
};

