function normalizeArray(items = []) {
  return items.map((item) => String(item).toLowerCase().trim()).filter(Boolean);
}

function getResumeCorpus(structuredResume) {
  return [
    structuredResume.summary || "",
    ...(structuredResume.skills || []),
    ...(structuredResume.workExperience || []).flatMap((entry) => [entry.role, entry.company, ...(entry.bullets || [])]),
    ...(structuredResume.projects || []).flatMap((entry) => [entry.name, entry.context, ...(entry.bullets || [])]),
    ...(structuredResume.education || []).flatMap((entry) => [entry.school, entry.degree, ...(entry.bullets || [])]),
    ...(structuredResume.extracurriculars || []).flatMap((entry) => [entry.name, entry.role, ...(entry.bullets || [])]),
    ...(structuredResume.certifications || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function keywordAppears(corpus, keyword) {
  return corpus.includes(keyword.toLowerCase());
}

function getAliases(keyword) {
  const lower = keyword.toLowerCase();
  const aliasMap = {
    javascript: ["js", "react", "frontend", "web applications"],
    java: ["object-oriented", "backend"],
    communication: ["social media", "customer service", "client presentations", "presentations", "cross-functional", "teamwork", "worked with"],
    excel: ["spreadsheets", "google sheets", "metrics", "tracked engagement"],
    analytics: ["google analytics", "tracked engagement", "performance reporting"],
    python: ["python scripts", "automation"],
    react: ["frontend features", "frontend", "web applications"],
    marketing: ["campaign", "brand", "social media"],
    writing: ["content", "copy", "social media"]
  };

  return aliasMap[lower] || [];
}

function mapTransferableGap(gap, corpus) {
  const aliases = getAliases(gap);
  const hint = aliases.find((candidate) => corpus.includes(candidate));
  if (!hint) {
    return null;
  }

  return `Transferable evidence found through ${hint}.`;
}

function scoreCompleteness(structuredResume) {
  const missing = structuredResume.flags?.missingCriticalSections?.length || 0;
  const sparse = structuredResume.flags?.sparseSections?.length || 0;
  const sectionBonus =
    (structuredResume.workExperience?.length ? 18 : 0) +
    (structuredResume.education?.length ? 16 : 0) +
    (structuredResume.skills?.length ? 16 : 0) +
    (structuredResume.projects?.length ? 10 : 0) +
    (structuredResume.certifications?.length ? 8 : 0) +
    (structuredResume.extracurriculars?.length ? 8 : 0);

  const base = 30 + sectionBonus - missing * 10 - sparse * 4;
  return Math.max(35, Math.min(100, base));
}

function scoreExperienceRelevance(jobProfile, corpus, structuredResume) {
  const responsibilitySignals = normalizeArray(jobProfile.keyResponsibilities || [])
    .flatMap((item) => item.split(/[,/]| and /))
    .map((item) => item.trim())
    .filter((item) => item.length >= 4)
    .slice(0, 20);

  const titleSignals = normalizeArray([jobProfile.jobTitle || ""]).flatMap((item) => item.split(/\s+/));
  const skillSignals = normalizeArray([...(jobProfile.requiredSkills || []), ...(jobProfile.preferredSkills || [])]);

  const candidateSignals = Array.from(new Set([...titleSignals, ...skillSignals, ...responsibilitySignals]))
    .filter((item) => item.length >= 3);

  if (!candidateSignals.length) {
    return structuredResume.workExperience?.length || structuredResume.projects?.length ? 70 : 45;
  }

  const matched = candidateSignals.filter((signal) => keywordAppears(corpus, signal) || mapTransferableGap(signal, corpus));
  const score = Math.round((matched.length / candidateSignals.length) * 100);
  return Math.max(25, Math.min(100, score));
}

function buildMismatchMatrix(structuredResume, jobProfile) {
  const corpus = getResumeCorpus(structuredResume);
  const requiredSkills = normalizeArray(jobProfile.requiredSkills || []);
  const preferredSkills = normalizeArray(jobProfile.preferredSkills || []);
  const directMatches = [];
  const softGaps = [];
  const hardGaps = [];

  requiredSkills.forEach((skill) => {
    if (keywordAppears(corpus, skill)) {
      directMatches.push({ type: "required-skill", value: skill, evidence: "Found directly in the resume." });
      return;
    }

    const transferable = mapTransferableGap(skill, corpus);
    if (transferable) {
      softGaps.push({ type: "transferable-gap", value: skill, evidence: transferable });
      return;
    }

    hardGaps.push({ type: "hard-gap", value: skill, evidence: "No direct evidence found in the resume." });
  });

  preferredSkills.forEach((skill) => {
    if (keywordAppears(corpus, skill)) {
      directMatches.push({ type: "preferred-skill", value: skill, evidence: "Found directly in the resume." });
    } else if (mapTransferableGap(skill, corpus)) {
      softGaps.push({ type: "preferred-gap", value: skill, evidence: "Adjacent experience may support this skill." });
    }
  });

  const keywordMatchPercent = requiredSkills.length
    ? Math.round(
        ((directMatches.filter((item) => item.type === "required-skill").length + softGaps.length * 0.5) / requiredSkills.length) * 100
      )
    : 100;

  const experienceRelevancePercent = scoreExperienceRelevance(jobProfile, corpus, structuredResume);
  const resumeCompletenessPercent = scoreCompleteness(structuredResume);

  const fitScore = Math.round(
    keywordMatchPercent * 0.4 +
      experienceRelevancePercent * 0.35 +
      resumeCompletenessPercent * 0.25
  );

  return {
    directMatches,
    softGaps,
    hardGaps,
    breakdown: {
      keywordMatchPercent,
      experienceRelevancePercent,
      resumeCompletenessPercent
    },
    fitScore
  };
}

module.exports = {
  buildMismatchMatrix
};
