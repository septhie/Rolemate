const { callOpenAIJson } = require("../api/openai");
const { buildVerificationPrompt } = require("../prompts/verificationPrompt");
const { buildVerificationAnswerPrompt } = require("../prompts/verificationAnswerPrompt");

function fallbackQuestionForGap(gap) {
  const lower = gap.toLowerCase();

  if (lower.includes("budget")) {
    return "Did you handle cash drawer reconciliation, track spending, or help with inventory ordering in any job, club, or project?";
  }

  if (lower.includes("lead")) {
    return "Did you ever train a new hire, coordinate teammates, or lead a class or club project?";
  }

  if (lower.includes("data")) {
    return "Have you used Excel, Google Sheets, or another tool to organize data, build reports, or analyze results in class, work, or a project?";
  }

  return `Have you done anything in school, work, volunteering, or projects that connects to ${gap}?`;
}

async function generateVerificationQuestions({ hardGaps, structuredResume, jobProfile, runContext }) {
  return callOpenAIJson({
    taskName: "verification-questions",
    runContext,
    systemPrompt: buildVerificationPrompt(),
    userPrompt: JSON.stringify({ hardGaps, structuredResume, jobProfile }, null, 2),
    fallback: () => ({
      questions: hardGaps.map((gap) => ({
        gap: gap.value,
        question: fallbackQuestionForGap(gap.value),
        rationale: "This checks for adjacent real experience before leaving the gap unresolved."
      }))
    })
  });
}

function heuristicVerification(answer) {
  const normalized = answer.trim().toLowerCase();
  const verified = /^(yes|yep|yeah|i did|i have|i handled|i used)/.test(normalized) && normalized.length > 15;
  return {
    verified,
    factSummary: verified ? answer.trim() : "",
    explanation: verified ? "The answer contains an affirmative factual detail." : "The answer did not verify a usable fact."
  };
}

async function verifyInterviewAnswer({ question, answer, runContext }) {
  return callOpenAIJson({
    taskName: "verification-answer",
    runContext,
    systemPrompt: buildVerificationAnswerPrompt(),
    userPrompt: `Question: ${question}\nAnswer: ${answer}`,
    fallback: () => heuristicVerification(answer)
  });
}

module.exports = {
  generateVerificationQuestions,
  verifyInterviewAnswer
};

