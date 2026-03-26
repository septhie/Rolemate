const { callOpenAIJson } = require("../api/openai");
const { buildGapAnalysisPrompt } = require("../prompts/gapAnalysisPrompt");

function fallbackGapAnalysis({ mismatchMatrix }) {
  const strengths = mismatchMatrix.directMatches.slice(0, 5).map((item) => `You already show ${item.value} in your resume.`);
  const missing = mismatchMatrix.hardGaps.slice(0, 5).map((item) => item.value);

  let honestAssessment = "You have some relevant material to work with, but there are clear gaps that need to be handled honestly.";
  if (mismatchMatrix.fitScore < 40) {
    honestAssessment = "This role looks like a real stretch based on the resume as written. Be direct about the gap, lean on transferable experience, and strengthen the application with relevant coursework, projects, or certifications before expecting strong traction.";
  } else if (mismatchMatrix.fitScore < 66) {
    honestAssessment = "You have a workable foundation, but the fit is partial. The best move is to tighten the resume around your strongest overlaps and verify any adjacent experience before adding it.";
  } else {
    honestAssessment = "You look meaningfully aligned for this role. The goal now is to sharpen wording, bring the right keywords forward, and quantify impact without overstating anything.";
  }

  if (!strengths.length) {
    strengths.push("Your resume still gives us a base to work from, especially through education, projects, or transferable responsibilities.");
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

