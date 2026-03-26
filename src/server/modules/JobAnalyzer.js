const { callOpenAIJson } = require("../api/openai");
const { buildJobAnalyzerPrompt } = require("../prompts/jobAnalyzerPrompt");

const knownSkills = [
  "excel",
  "sql",
  "python",
  "java",
  "javascript",
  "react",
  "next.js",
  "node.js",
  "tableau",
  "power bi",
  "salesforce",
  "budget management",
  "leadership",
  "project management",
  "communication",
  "customer service",
  "data analysis",
  "google sheets"
];

function inferExperienceLevel(text) {
  const lower = text.toLowerCase();
  if (/senior|7\+ years|8\+ years|leadership experience/.test(lower)) {
    return "senior";
  }
  if (/3\+ years|5\+ years|mid-level|manager/.test(lower)) {
    return "mid";
  }
  return "entry";
}

function fallbackJobAnalysis(jobDescription, { jobTitle, companyName }) {
  const lower = jobDescription.toLowerCase();
  const requiredSkills = knownSkills.filter((skill) => lower.includes(skill));
  const lines = jobDescription.split("\n").map((line) => line.trim()).filter(Boolean);

  return {
    requiredSkills,
    preferredSkills: [],
    experienceLevel: inferExperienceLevel(jobDescription),
    keyResponsibilities: lines.filter((line) => /^[•*-]/.test(line) || /responsib/.test(line.toLowerCase())).slice(0, 8).map((item) => item.replace(/^[•*-]\s*/, "")),
    industryKeywords: Array.from(new Set([...requiredSkills, ...jobDescription.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || []])).slice(0, 15),
    toneSignals: {
      style: /startup|fast-paced|scrappy|build/i.test(lower) ? "casual/startup" : "formal/corporate",
      evidence: [jobTitle, companyName].filter(Boolean)
    },
    minimumQualifications: lines.filter((line) => /require|qualif|must have/i.test(line)).slice(0, 6)
  };
}

async function analyzeJobDescription({ jobDescription, jobTitle, companyName, runContext }) {
  return callOpenAIJson({
    taskName: "job-analyzer",
    runContext,
    systemPrompt: buildJobAnalyzerPrompt(),
    userPrompt: `Job title: ${jobTitle || "Unknown"}\nCompany: ${companyName || "Unknown"}\n\nJob description:\n${jobDescription}`,
    fallback: () => fallbackJobAnalysis(jobDescription, { jobTitle, companyName })
  });
}

module.exports = {
  analyzeJobDescription
};
