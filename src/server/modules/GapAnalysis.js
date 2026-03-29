const { callOpenAIJson } = require("../api/openai");
const { buildGapAnalysisPrompt } = require("../prompts/gapAnalysisPrompt");

function formatStrength(item) {
  if (item.type === "required-skill" || item.type === "preferred-skill") {
    return `You already show ${item.value}, which maps directly to the role.`;
  }

  return `You have grounded evidence for ${item.value}.`;
}

function buildStrengths(structuredResume, mismatchMatrix) {
  const strengths = mismatchMatrix.directMatches.slice(0, 4).map(formatStrength);

  const summary = (structuredResume.summary || "").toLowerCase();
  if (/intern/.test(summary) && strengths.length < 4) {
    strengths.push("You already have internship experience, which helps make the application feel more job-ready.");
  }

  if (/project/.test(summary) && strengths.length < 4) {
    strengths.push("Projects give you real material to position, especially when direct work history is limited.");
  }

  if (/gpa/.test(summary) && strengths.length < 4) {
    strengths.push("Your academic detail gives the resume more credibility than a completely blank student profile.");
  }

  if (!strengths.length) {
    strengths.push("Your resume still gives us a base to work from, especially through education, projects, or transferable responsibilities.");
  }

  return strengths.slice(0, 5);
}

function fallbackGapAnalysis({ structuredResume, mismatchMatrix }) {
  const strengths = buildStrengths(structuredResume, mismatchMatrix);
  const missing = mismatchMatrix.hardGaps.slice(0, 5).map((item) => item.value);

  let honestAssessment = "You have some relevant material to work with, but there are clear gaps that need to be handled honestly.";
  if (mismatchMatrix.fitScore < 40) {
    honestAssessment =
      "This role looks like a real stretch based on the resume as written. Be direct about the gap, lean on transferable experience, and strengthen the application with relevant coursework, projects, or certifications before expecting strong traction.";
  } else if (mismatchMatrix.fitScore < 66) {
    honestAssessment =
      "You have a workable foundation, but the fit is partial. The best move is to tighten the resume around your strongest overlaps and verify any adjacent experience before adding it.";
  } else {
    honestAssessment =
      "You look meaningfully aligned for this role. The goal now is to sharpen wording, bring the right keywords forward, and quantify impact without overstating anything.";
  }

  return {
    strengths,
    missing,
    honestAssessment
  };
}

async function generateGapAnalysis({ structuredResume, jobProfile, mismatchMatrix, runContext }) {
  return callOpenAIJson({
    taskName: "gap-analysis",
    runContext,
    systemPrompt: buildGapAnalysisPrompt(),
    userPrompt: JSON.stringify({ structuredResume, jobProfile, mismatchMatrix }, null, 2),
    fallback: () => fallbackGapAnalysis({ structuredResume, jobProfile, mismatchMatrix })
  });
}

module.exports = {
  generateGapAnalysis
};
