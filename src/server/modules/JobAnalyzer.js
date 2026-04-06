const { callOpenAIJson } = require("../api/openai");
const { buildJobAnalyzerPrompt } = require("../prompts/jobAnalyzerPrompt");
const { condenseText } = require("../utils/promptCompression");

const knownSkills = [
  "google analytics",
  "content calendars",
  "cloud deployment",
  "project management",
  "budget management",
  "data analysis",
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
  "leadership",
  "communication",
  "customer service",
  "google sheets",
  "social media",
  "financial modeling",
  "valuation",
  "powerpoint",
  "debugging",
  "git",
  "apis",
  "testing",
  "analytics",
  "writing",
  "collaboration",
  "organization",
  "marketing",
  "brand support"
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsSkill(text, skill) {
  const pattern = skill.includes(".")
    ? new RegExp(escapeRegex(skill), "i")
    : new RegExp(`(^|[^a-z])${escapeRegex(skill)}([^a-z]|$)`, "i");
  return pattern.test(text);
}

function inferExperienceLevel(text) {
  const lower = text.toLowerCase();
  if (/senior|director|8\+ years|7\+ years|leadership experience/.test(lower)) {
    return "senior";
  }
  if (/3\+ years|4\+ years|5\+ years|mid-level|manager|experienced/.test(lower)) {
    return "mid";
  }
  return "entry";
}

function splitLines(jobDescription) {
  return jobDescription
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractSkillsFromText(text) {
  const lower = text.toLowerCase();
  return knownSkills
    .slice()
    .sort((left, right) => right.length - left.length)
    .filter((skill) => containsSkill(lower, skill));
}

function unique(items = []) {
  return Array.from(new Set(items.filter(Boolean)));
}

function fallbackJobAnalysis(jobDescription, { jobTitle, companyName }) {
  const lower = jobDescription.toLowerCase();
  const lines = splitLines(jobDescription);
  const requiredSkills = [];
  const preferredSkills = [];
  const keyResponsibilities = [];
  const minimumQualifications = [];

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    const skills = extractSkillsFromText(line);

    if (/nice to have|preferred|bonus|plus/i.test(lineLower)) {
      preferredSkills.push(...skills);
      continue;
    }

    if (/require|must|qualification|experience with|proficient|strong /i.test(lineLower)) {
      requiredSkills.push(...skills);
      minimumQualifications.push(line.replace(/^[-*•]\s*/, ""));
    }

    if (/responsib|build|collaborate|write|ship|execute|coordinate|support|manage|track|review/i.test(lineLower)) {
      keyResponsibilities.push(line.replace(/^[-*•]\s*/, ""));
    }
  }

  const fallbackRequired = requiredSkills.length ? requiredSkills : extractSkillsFromText(jobDescription).slice(0, 8);
  const titleKeywords = (jobTitle || "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2);

  return {
    requiredSkills: unique(fallbackRequired),
    preferredSkills: unique(preferredSkills),
    experienceLevel: inferExperienceLevel(jobDescription),
    keyResponsibilities: unique(keyResponsibilities).slice(0, 8),
    industryKeywords: unique([
      ...fallbackRequired,
      ...preferredSkills,
      ...titleKeywords,
      ...(jobDescription.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || [])
    ]).slice(0, 18),
    toneSignals: {
      style: /jpmorgan|jp morgan|bank|analyst|coordinator|consumer brand|global|regulated|cross-functional/i.test(lower)
        ? "formal/corporate"
        : /startup|fast-paced|scrappy|build/i.test(lower)
          ? "casual/startup"
          : "formal/corporate",
      evidence: [jobTitle, companyName].filter(Boolean)
    },
    minimumQualifications: unique(minimumQualifications).slice(0, 6)
  };
}

async function analyzeJobDescription({ jobDescription, jobTitle, companyName, runContext }) {
  const condensedJobDescription = condenseText(jobDescription, 5200);

  return callOpenAIJson({
    taskName: "job-analyzer",
    runContext,
    systemPrompt: buildJobAnalyzerPrompt(),
    userPrompt: `Job title: ${jobTitle || "Unknown"}\nCompany: ${companyName || "Unknown"}\n\nJob description:\n${condensedJobDescription}`,
    fallback: () => fallbackJobAnalysis(jobDescription, { jobTitle, companyName })
  });
}

module.exports = {
  analyzeJobDescription
};
