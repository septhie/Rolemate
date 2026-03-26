const { callOpenAIJson } = require("../api/openai");
const { buildResumeParserPrompt } = require("../prompts/resumeParserPrompt");

function splitByHeadings(text) {
  const headingMap = {
    summary: /summary|objective|profile/i,
    workExperience: /experience|employment|work history|professional experience/i,
    education: /education|academics/i,
    skills: /skills|technical skills|core competencies/i,
    projects: /projects|portfolio/i,
    extracurriculars: /activities|leadership|extracurricular/i,
    certifications: /certifications|licenses/i
  };

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const sections = {
    contactInfo: {},
    summary: "",
    workExperience: [],
    education: [],
    skills: [],
    projects: [],
    extracurriculars: [],
    certifications: [],
    flags: {
      missingCriticalSections: [],
      sparseSections: [],
      warnings: []
    }
  };

  let current = "summary";
  const buckets = {
    summary: [],
    workExperience: [],
    education: [],
    skills: [],
    projects: [],
    extracurriculars: [],
    certifications: []
  };

  lines.forEach((line, index) => {
    if (index < 4) {
      if (!sections.contactInfo.email && /\S+@\S+\.\S+/.test(line)) {
        sections.contactInfo.email = line.match(/\S+@\S+\.\S+/)?.[0] || "";
      }
      if (!sections.contactInfo.phone && /(\+?\d[\d\s().-]{8,})/.test(line)) {
        sections.contactInfo.phone = line.match(/(\+?\d[\d\s().-]{8,})/)?.[0] || "";
      }
      if (!sections.contactInfo.name && /^[A-Za-z ,.'-]{5,}$/.test(line) && !line.includes("@")) {
        sections.contactInfo.name = line;
      }
    }

    const matchedHeading = Object.entries(headingMap).find(([, pattern]) => pattern.test(line));
    if (matchedHeading && line.length < 32) {
      current = matchedHeading[0];
      return;
    }

    buckets[current].push(line);
  });

  sections.summary = buckets.summary.slice(0, 3).join(" ");
  sections.skills = buckets.skills.join(" ").split(/[,|•]/).map((item) => item.trim()).filter(Boolean);

  const bucketToEntries = (items, defaultKey) => {
    if (!items.length) {
      return [];
    }

    const chunks = [];
    let currentChunk = [];

    items.forEach((line) => {
      if (/^[A-Z][A-Za-z0-9/&,.() -]{3,}$/.test(line) && currentChunk.length) {
        chunks.push(currentChunk);
        currentChunk = [line];
      } else {
        currentChunk.push(line);
      }
    });

    if (currentChunk.length) {
      chunks.push(currentChunk);
    }

    return chunks.map((chunk) => ({
      [defaultKey]: chunk[0] || "",
      bullets: chunk.slice(1).map((line) => line.replace(/^[-•]\s*/, "")).filter(Boolean)
    }));
  };

  sections.workExperience = bucketToEntries(buckets.workExperience, "role").map((entry) => ({
    role: entry.role,
    company: "",
    location: "",
    dates: "",
    bullets: entry.bullets
  }));
  sections.education = bucketToEntries(buckets.education, "school").map((entry) => ({
    school: entry.school,
    degree: "",
    location: "",
    dates: "",
    bullets: entry.bullets
  }));
  sections.projects = bucketToEntries(buckets.projects, "name").map((entry) => ({
    name: entry.name,
    context: "",
    bullets: entry.bullets
  }));
  sections.extracurriculars = bucketToEntries(buckets.extracurriculars, "name").map((entry) => ({
    name: entry.name,
    role: "",
    bullets: entry.bullets
  }));
  sections.certifications = buckets.certifications.join(" ").split(/[,|•]/).map((item) => item.trim()).filter(Boolean);

  ["workExperience", "education", "skills"].forEach((section) => {
    const hasContent = Array.isArray(sections[section]) ? sections[section].length > 0 : Boolean(sections[section]);
    if (!hasContent) {
      sections.flags.missingCriticalSections.push(section);
    }
  });

  sections.workExperience.forEach((entry, index) => {
    if (entry.bullets.length <= 1) {
      sections.flags.sparseSections.push(`workExperience:${index}`);
    }
  });

  return sections;
}

async function parseResume(resumeText, runContext) {
  return callOpenAIJson({
    taskName: "resume-parser",
    runContext,
    systemPrompt: buildResumeParserPrompt(),
    userPrompt: `Resume text:\n${resumeText}`,
    fallback: () => splitByHeadings(resumeText)
  });
}

module.exports = {
  parseResume
};

