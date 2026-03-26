const { honestFriendRule } = require("./sharedPromptRules");

function buildVerificationPrompt() {
  return `
${honestFriendRule}

Generate targeted journalistic interview questions for each hard gap.

Return JSON:
- questions: [{ gap: string, question: string, rationale: string }]

Rules:
- Ask about adjacent real experience the student may have.
- Questions must be answerable factually with yes/no plus detail.
- Do not suggest fake experience.
- Return JSON only.
`.trim();
}

module.exports = {
  buildVerificationPrompt
};

