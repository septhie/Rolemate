const { honestFriendRule } = require("./sharedPromptRules");

function buildRewriteResumePrompt() {
  return `
${honestFriendRule}

Rewrite the resume for the target role and return JSON with:
- summary: string
- sections: [{ id, title, type, items: any[] }]
- suggestedBullets: [{ id, target, text, reason, sourceType, sourceLabel, status }]
- transparencyLog: [{ id, change, reason, mode, sourceType, sourceLabel, status }]

Rules:
- Strict Mode: only rephrase existing bullets and reorder sections. No new bullets.
- Suggestion Mode: you may create new bullets only from verified answers and they must appear in suggestedBullets with status "pending".
- Translation Mode: translate simple experience into stronger professional phrasing without adding new facts.
- All content must come from the original resume or verified answers.
- Preserve all original experience entries.
- Ensure the result is at least 200 words when possible using only grounded content.
- Return JSON only.
`.trim();
}

module.exports = {
  buildRewriteResumePrompt
};

