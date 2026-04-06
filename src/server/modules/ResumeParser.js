const { callOpenAIJson } = require("../api/openai");
const { buildResumeParserPrompt } = require("../prompts/resumeParserPrompt");
const { condenseText } = require("../utils/promptCompression");

const knownSkillTerms = [
  "python",
  "react",
  "javascript",
  "typescript",
  "java",
  "excel",
  "powerpoint",
  "google analytics",
  "google sheets",
  "sql",
  "apis",
  "api integrations",
  "financial modeling",
  "valuation",
  "social media",
  "content calendars",
  "analytics",
  "brand marketing",
  "communication",
  "customer service",
  "leadership",
  "debugging",
  "git"
];

function normalizeBullet(line) {
  return line.replace(/^[-*•]\s*/, "").trim();
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(text, term) {
  const pattern = term.includes(".")
    ? new RegExp(escapeRegex(term), "i")
    : new RegExp(`(^|[^a-z])${escapeRegex(term)}([^a-z]|$)`, "i");
  return pattern.test(text);
}

function extractContactInfo(lines) {
  const contactInfo = {
    name: "",
    email: "",
    phone: "",
    location: "",
    links: []
  };

  for (const line of lines.slice(0, 6)) {
    if (!contactInfo.email && /\S+@\S+\.\S+/.test(line)) {
      contactInfo.email = line.match(/\S+@\S+\.\S+/)?.[0] || "";
    }

    if (!contactInfo.phone && /(\+?\d[\d\s().-]{8,})/.test(line)) {
      contactInfo.phone = line.match(/(\+?\d[\d\s().-]{8,})/)?.[0] || "";
    }

    if (!contactInfo.name && /^[A-Za-z ,.'-]{5,}$/.test(line) && !line.includes("@")) {
      contactInfo.name = line;
    }

    const urls = line.match(/https?:\/\/\S+|linkedin\.com\/\S+|github\.com\/\S+/gi) || [];
    if (urls.length) {
      contactInfo.links.push(...urls);
    }
  }

  contactInfo.links = Array.from(new Set(contactInfo.links));
  return contactInfo;
}

function parseInlineEducation(text) {
  const education = [];
  const lower = text.toLowerCase();
  const sentence = splitSentences(text).find((item) =>
    /(major|gpa|freshman|sophomore|junior|senior|bachelor|b\.s|b\.a|student)/i.test(item)
  );

  if (!sentence) {
    return education;
  }

  const degreeMatch = sentence.match(
    /(finance|marketing|computer science|economics|accounting|business|engineering|data science)[^,.]{0,30}(major|student)|((freshman|sophomore|junior|senior)[^,.]{0,40})/i
  );
  const gpaMatch = text.match(/gpa[:\s]+([0-4]\.\d{1,2})/i);

  education.push({
    school: "",
    degree: degreeMatch ? degreeMatch[0].trim() : "",
    location: "",
    dates: "",
    bullets: [
      gpaMatch ? `GPA ${gpaMatch[1]}` : "",
      /(senior|junior|sophomore|freshman)/i.test(sentence) ? sentence.match(/(senior|junior|sophomore|freshman)/i)?.[0] : ""
    ].filter(Boolean)
  });

  return education;
}

function parseInlineWork(text) {
  const sentences = splitSentences(text);
  const workEntries = [];

  for (const sentence of sentences) {
    if (/^no internships?\.?$/i.test(sentence) || /^no experience\.?$/i.test(sentence)) {
      continue;
    }

    if (!/(intern|internship|worked|experience|crew member|associate|assistant|coordinator|manager|cashier|startup|mcdonald)/i.test(sentence)) {
      continue;
    }

    const normalizedSentence = sentence.replace(/^work experience:\s*/i, "").trim();
    const roleMatch =
      normalizedSentence.match(/(McDonald's\s+Crew\s+Member)/i) ||
      normalizedSentence.match(
        /\b([A-Z][A-Za-z&/'-]+(?:\s+[A-Z][A-Za-z&/'-]+){0,3}\s+(?:Intern|Engineer|Crew Member|Assistant|Coordinator|Associate|Manager|Cashier|Analyst))\b/i
      ) ||
      normalizedSentence.match(/\b(Marketing Intern|Brand Marketing Intern|Software Engineering Intern)\b/i);

    const durationMatch = sentence.match(/(\d+\s*(year|month)s?)/i);
    const companyMatch =
      sentence.match(/at ([A-Z][A-Za-z0-9&' .-]+)/) ||
      sentence.match(/for ([A-Z][A-Za-z0-9&' .-]+ (club|company|startup))/i);

    const bulletParts = normalizedSentence
      .split(/,| and /)
      .map((item) => item.replace(/^work experience:\s*/i, "").trim())
      .filter((item) => item.length > 3)
      .filter((item) => !/^\d+\s*(year|month)s?\.?$/i.test(item))
      .filter((item) => !/^no internships?\.?$/i.test(item));

    const role = roleMatch ? roleMatch[0].trim() : normalizedSentence;
    const cleanedBullets = bulletParts
      .filter((item) => normalizeBullet(item).toLowerCase() !== role.toLowerCase())
      .map(normalizeBullet)
      .filter((item) => item.length > 3)
      .filter((item) => !/^(intern(ship)? experience|work experience)$/i.test(item));

    workEntries.push({
      role,
      company: companyMatch ? companyMatch[1].trim() : "",
      location: "",
      dates: durationMatch ? durationMatch[1] : "",
      bullets: cleanedBullets
    });
  }

  return workEntries;
}

function parseInlineProjects(text) {
  const sentences = splitSentences(text);
  const projects = [];

  for (const sentence of sentences) {
    if (!/(project|portfolio|task manager|api integration|internal tool|built|created)/i.test(sentence)) {
      continue;
    }

    if (/(intern|marketing intern|crew member)/i.test(sentence)) {
      continue;
    }

    const projectNames = sentence.match(/task manager|portfolio site|api integrations?|internal tools?/gi) || [];
    if (projectNames.length) {
      projectNames.forEach((name) => {
        projects.push({
          name,
          context: "",
          bullets: [sentence]
        });
      });
      continue;
    }

    projects.push({
      name: sentence.slice(0, 60),
      context: "",
      bullets: [sentence]
    });
  }

  return projects;
}

function parseInlineExtracurriculars(text) {
  const items = [];
  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    if (!/(club|student organization|social media for|leadership|volunteer)/i.test(sentence)) {
      continue;
    }

    items.push({
      name: /club/i.test(sentence) ? "Student club" : "Extracurricular involvement",
      role: /social media/i.test(sentence) ? "Social media lead/support" : "",
      bullets: [sentence]
    });
  }

  return items;
}

function parseInlineCertifications(text) {
  const certs = [];
  const matches = text.match(/google analytics( certified| certification)?/gi) || [];
  matches.forEach((item) => certs.push(item.replace(/\s+/g, " ").trim()));
  return Array.from(new Set(certs));
}

function parseSkills(text) {
  const lower = text.toLowerCase();
  return knownSkillTerms
    .filter((skill) => containsTerm(lower, skill))
    .map((skill) => skill.replace(/\b\w/g, (char) => char.toUpperCase()));
}

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
    contactInfo: extractContactInfo(lines),
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

  lines.forEach((line) => {
    const matchedHeading = Object.entries(headingMap).find(([, pattern]) => pattern.test(line));
    if (matchedHeading && line.length < 40) {
      current = matchedHeading[0];
      return;
    }

    buckets[current].push(line);
  });

  const hasExplicitHeadings = Object.values(buckets).some((bucket) => bucket.length > 1);

  sections.summary = buckets.summary.slice(0, 4).join(" ") || text.slice(0, 240).trim();
  sections.skills = buckets.skills.length
    ? buckets.skills.join(" ").split(/[,|•]/).map((item) => item.trim()).filter(Boolean)
    : parseSkills(text);

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
      bullets: chunk.slice(1).map(normalizeBullet).filter(Boolean)
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
  sections.certifications = buckets.certifications.length
    ? buckets.certifications.join(" ").split(/[,|•]/).map((item) => item.trim()).filter(Boolean)
    : parseInlineCertifications(text);

  if (!hasExplicitHeadings) {
    sections.workExperience = sections.workExperience.length ? sections.workExperience : parseInlineWork(text);
    sections.education = sections.education.length ? sections.education : parseInlineEducation(text);
    sections.projects = sections.projects.length ? sections.projects : parseInlineProjects(text);
    sections.extracurriculars = sections.extracurriculars.length ? sections.extracurriculars : parseInlineExtracurriculars(text);
    sections.certifications = sections.certifications.length ? sections.certifications : parseInlineCertifications(text);
    if (!sections.skills.length) {
      sections.skills = parseSkills(text);
    }
  }

  ["workExperience", "education", "skills"].forEach((section) => {
    const hasContent = Array.isArray(sections[section]) ? sections[section].length > 0 : Boolean(sections[section]);
    if (!hasContent) {
      sections.flags.missingCriticalSections.push(section);
    }
  });

  ["workExperience", "projects", "education", "extracurriculars"].forEach((section) => {
    sections[section].forEach((entry, index) => {
      if ((entry.bullets || []).length <= 1) {
        sections.flags.sparseSections.push(`${section}:${index}`);
      }
    });
  });

  return sections;
}

async function parseResume(resumeText, runContext) {
  const condensedResumeText = condenseText(resumeText, 4200);

  return callOpenAIJson({
    taskName: "resume-parser",
    runContext,
    systemPrompt: buildResumeParserPrompt(),
    userPrompt: `Resume text:\n${condensedResumeText}`,
    fallback: () => splitByHeadings(resumeText)
  });
}

module.exports = {
  parseResume
};
