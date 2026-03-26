const { honestFriendRule } = require("./sharedPromptRules");

function buildSelfCheckPrompt() {
  return `
${honestFriendRule}

Audit the rewritten resume.

Return JSON:
- passed: boolean
- issues: string[]
- wordCount: number

Rules:
- Fail if the rewrite contains facts not present in the original resume or verified answers.
- Fail if any original experience entry is missing.
- Fail if the rewrite is under 200 words.
- Return JSON only.
`.trim();
}

module.exports = {
  buildSelfCheckPrompt
};

