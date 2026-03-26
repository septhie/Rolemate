function normalizeArray(items = []) {
  return items.map((item) => item.toLowerCase().trim()).filter(Boolean);
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

function mapTransferableGap(gap, corpus) {
  const lowerGap = gap.toLowerCase();
  const mappings = [
    { gap: "leadership", hints: ["led", "captain", "mentor", "trained", "group project"] },
    { gap: "budget management", hints: ["cash", "drawer", "inventory", "reconciliation"] },
    { gap: "data analysis", hints: ["excel", "google sheets", "reports", "metrics"] },
    { gap: "project management", hints: ["organized", "timeline", "coordinated"] }
  ];

  const match = mappings.find((item) => lowerGap.includes(item.gap));
  if (!match) {
    return null;
  }

  const hint = match.hints.find((candidate) => corpus.includes(candidate));
  return hint ? `Transferable evidence found through ${hint}.` : null;
}

function scoreCompleteness(structuredResume) {
  const missing = structuredResume.flags?.missingCriticalSections?.length || 0;
  const sparse = structuredResume.flags?.sparseSections?.length || 0;
  const base = 100 - missing * 20 - sparse * 8;
  return Math.max(20, Math.min(100, base));
}

function scoreExperienceRelevance(jobProfile, corpus) {
  const responsibilities = normalizeArray(jobProfile.keyResponsibilities || []);
  if (!responsibilities.length) {
    return corpus.length > 200 ? 70 : 45;
  }

  const matches = responsibilities.filter((item) => keywordAppears(corpus, item.slice(0, 24))).length;
  return Math.max(20, Math.min(100, Math.round((matches / responsibilities.length) * 100)));
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
    } else {
      softGaps.push({ type: "preferred-gap", value: skill, evidence: "Nice-to-have skill not shown directly." });
    }
  });

  const keywordMatchPercent = requiredSkills.length
    ? Math.round((directMatches.filter((item) => item.type === "required-skill").length / requiredSkills.length) * 100)
    : 100;
  const experienceRelevancePercent = scoreExperienceRelevance(jobProfile, corpus);
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

