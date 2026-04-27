function normalizeArray(items = []) {
  return items.map((item) => String(item).toLowerCase().trim()).filter(Boolean);
}

function unique(items = []) {
  return Array.from(new Set(items.filter(Boolean)));
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

function getResumeSignals(structuredResume) {
  return unique(
    [
      ...(structuredResume.skills || []),
      ...(structuredResume.workExperience || []).flatMap((entry) => [entry.role, ...(entry.bullets || [])]),
      ...(structuredResume.projects || []).flatMap((entry) => [entry.name, ...(entry.bullets || [])]),
      ...(structuredResume.education || []).flatMap((entry) => [entry.degree, ...(entry.bullets || [])]),
      ...(structuredResume.extracurriculars || []).flatMap((entry) => [entry.name, entry.role, ...(entry.bullets || [])]),
      ...(structuredResume.certifications || []),
      structuredResume.summary || ""
    ]
      .filter(Boolean)
      .map((item) => String(item).toLowerCase())
  );
}

function getAliases(keyword) {
  const lower = keyword.toLowerCase();
  const aliasMap = {
    javascript: ["js", "react", "frontend", "web applications"],
    java: ["object-oriented", "backend"],
    communication: [
      "social media",
      "customer service",
      "client presentations",
      "presentations",
      "cross-functional",
      "teamwork",
      "worked with",
      "communicated weekly",
      "candidate communication",
      "client relationships",
      "front desk"
    ],
    excel: ["spreadsheets", "google sheets", "metrics", "tracked engagement", "tableau", "workpapers"],
    analytics: ["google analytics", "tracked engagement", "performance reporting", "dashboard", "tableau", "survey data", "user feedback"],
    python: ["python scripts", "automation"],
    react: ["frontend features", "frontend", "web applications"],
    marketing: ["campaign", "brand", "social media"],
    writing: ["content", "copy", "social media"],
    organization: [
      "content calendar",
      "content calendars",
      "inventory",
      "operations",
      "scheduling",
      "timelines",
      "deliverables",
      "weekly status notes",
      "events",
      "treasurer",
      "inventory counts",
      "matched mentors"
    ],
    collaboration: ["cross-functional", "teamwork", "worked with", "partnered", "sales and support", "volunteers", "mentors"],
    apis: ["api integrations", "api", "rest"],
    git: ["github", "version control"],
    debugging: ["troubleshooting", "fixed bugs", "bug fixes", "qa", "tested", "ticket escalations", "endpoint issues"],
    testing: ["audit testing", "auditing", "documentation review"],
    scheduling: ["scheduled", "scheduling", "weekly status notes", "events", "matched mentors"],
    "security fundamentals": ["security+", "wireshark", "splunk", "kali linux", "home lab"],
    "log analysis": ["splunk", "logs", "wireshark"],
    ticketing: ["tickets", "ticket escalations", "it support"],
    troubleshooting: ["endpoint issues", "troubleshooting", "it support"],
    leadership: ["shift lead", "trained new hires", "president", "treasurer", "led a campus fundraiser"]
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

function scoreSignalOverlap(signals, corpus) {
  const relevant = signals.filter((signal) => signal.length >= 4);
  if (!relevant.length) {
    return 0;
  }

  const matched = relevant.filter((signal) => keywordAppears(corpus, signal) || mapTransferableGap(signal, corpus));
  return Math.round((matched.length / relevant.length) * 100);
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
  const title = normalizeArray([jobProfile.jobTitle || ""]).join(" ");
  const resumeSignals = getResumeSignals(structuredResume);
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
  let score = Math.round((matched.length / candidateSignals.length) * 100);
  const signalOverlap = scoreSignalOverlap(resumeSignals, corpus);

  const hasInternship = /intern/.test(corpus);
  const hasProjects = structuredResume.projects?.length > 0;

  if (/software|engineer|developer/.test(title)) {
    if (hasInternship) score += 18;
    if (hasProjects) score += 12;
    if (/react|javascript|python|api/.test(corpus)) score += 12;
  } else if (/data|analyst/.test(title)) {
    if (/sql|python|tableau|dashboard|analytics|survey data/.test(corpus)) score += 22;
    if (hasProjects) score += 10;
  } else if (/marketing|brand|content|social/.test(title)) {
    if (hasInternship) score += 20;
    if (/social media|analytics|campaign|brand|google analytics/.test(corpus)) score += 18;
    if (structuredResume.certifications?.length) score += 8;
  } else if (/investment|banking|finance|analyst/.test(title)) {
    if (/finance|economics|accounting/.test(corpus)) score += 12;
    if (/excel|valuation|modeling|powerpoint/.test(corpus)) score += 18;
  } else if (/operations|coordinator/.test(title)) {
    if (/inventory|scheduling|trained|shift lead|customer issues|operations|deliverables/.test(corpus)) score += 24;
    if (/communication|customer service|front desk|coordinated/.test(corpus)) score += 10;
  } else if (/recruit|talent/.test(title)) {
    if (/organized events|communicated weekly|front desk|matched mentors|president/.test(corpus)) score += 24;
    if (/scheduling|mentoring|participants|medical office/.test(corpus)) score += 10;
  } else if (/audit|account/.test(title)) {
    if (/accounting|auditing|excel|vita|tax|treasurer/.test(corpus)) score += 24;
    if (/volunteer|documentation|detail/.test(corpus)) score += 8;
  } else if (/soc|security/.test(title)) {
    if (/security\+|splunk|wireshark|kali linux|home lab/.test(corpus)) score += 26;
    if (/ticket|troubleshooting|endpoint|it support/.test(corpus)) score += 12;
  } else if (/project|program/.test(title)) {
    if (/timeline|deliverables|status notes|cross-functional|volunteers|program management/.test(corpus)) score += 26;
    if (/organization|communication|tracked/.test(corpus)) score += 8;
  } else if (/product manager/.test(title)) {
    if (/user feedback|client relationships|sales and support|renewal/.test(corpus)) score += 18;
    if (/cross-functional|managed/.test(corpus)) score += 8;
  }

  score = Math.round(score * 0.8 + signalOverlap * 0.2);
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
        ((directMatches.filter((item) => item.type === "required-skill").length + softGaps.length * 0.75) / requiredSkills.length) * 100
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
