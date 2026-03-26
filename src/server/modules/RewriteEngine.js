const { callOpenAIJson } = require("../api/openai");
const { buildRewriteResumePrompt } = require("../prompts/rewriteResumePrompt");
const { buildSelfCheckPrompt } = require("../prompts/selfCheckPrompt");
const { createTransparencyEntry } = require("./TransparencyLog");
const { renderResumeHtml } = require("./ResumeRenderer");

function sentenceCase(text = "") {
  if (!text) {
    return "";
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function strengthenBullet(bullet, mode) {
  const clean = bullet.replace(/^[-•]\s*/, "").trim();
  if (!clean) {
    return "";
  }

  const normalized = clean.charAt(0).toLowerCase() + clean.slice(1);
  if (mode === "Translation") {
    return sentenceCase(normalized.replace(/^worked/, "managed").replace(/^helped/, "supported").replace(/^did/, "executed"));
  }

  if (mode === "Strict") {
    return sentenceCase(normalized.replace(/^responsible for/, "Handled"));
  }

  return sentenceCase(normalized.replace(/^worked/, "Contributed").replace(/^helped/, "Supported"));
}

function buildContactLine(contactInfo = {}) {
  return [contactInfo.email, contactInfo.phone, contactInfo.location, ...(contactInfo.links || [])].filter(Boolean).join(" | ");
}

function buildFallbackRewrite({ structuredResume, jobProfile, verificationLogs, mode }) {
  const verifiedFacts = verificationLogs.filter((item) => item.verified && item.factSummary);
  const sections = [];
  const transparencyLog = [];

  const summarySource = structuredResume.summary
    ? structuredResume.summary
    : `Candidate targeting ${jobProfile.jobTitle || "the role"} with strengths in ${(structuredResume.skills || []).slice(0, 5).join(", ")}.`;

  const summary = sentenceCase(summarySource);

  if (structuredResume.skills?.length) {
    sections.push({
      id: "skills",
      title: "Skills",
      type: "skill-list",
      items: structuredResume.skills
    });
  }

  if (structuredResume.workExperience?.length) {
    sections.push({
      id: "experience",
      title: "Experience",
      type: "entries",
      items: structuredResume.workExperience.map((entry, index) => ({
        title: entry.role || `Experience ${index + 1}`,
        subtitle: [entry.company, entry.location].filter(Boolean).join(" | "),
        dates: entry.dates || "",
        bullets: (entry.bullets || []).map((bullet, bulletIndex) => {
          const text = strengthenBullet(bullet, mode);
          transparencyLog.push(
            createTransparencyEntry({
              id: `exp-${index}-${bulletIndex}`,
              change: `Rephrased bullet: ${text}`,
              reason: "Improved clarity and action-oriented wording without changing the fact pattern.",
              mode,
              sourceType: "original",
              sourceLabel: entry.role || "Work experience"
            })
          );
          return { text };
        })
      }))
    });
  }

  if (structuredResume.projects?.length) {
    sections.push({
      id: "projects",
      title: "Projects",
      type: "entries",
      items: structuredResume.projects.map((entry, index) => ({
        title: entry.name || `Project ${index + 1}`,
        subtitle: entry.context || "",
        dates: "",
        bullets: (entry.bullets || []).map((bullet, bulletIndex) => {
          const text = strengthenBullet(bullet, mode);
          transparencyLog.push(
            createTransparencyEntry({
              id: `project-${index}-${bulletIndex}`,
              change: `Rephrased project bullet: ${text}`,
              reason: "Highlighted relevant project impact using the same underlying fact.",
              mode,
              sourceType: "original",
              sourceLabel: entry.name || "Project"
            })
          );
          return { text };
        })
      }))
    });
  }

  if (structuredResume.education?.length) {
    sections.push({
      id: "education",
      title: "Education",
      type: "entries",
      items: structuredResume.education.map((entry) => ({
        title: entry.school,
        subtitle: entry.degree,
        dates: entry.dates,
        bullets: (entry.bullets || []).map((bullet) => ({ text: bullet }))
      }))
    });
  }

  const suggestedBullets =
    mode === "Suggestion"
      ? verifiedFacts.map((item, index) => {
          // Suggested bullets stay pending until the user explicitly approves them in the preview UI.
          const target = structuredResume.workExperience?.[0]?.role || "Experience";
          const text = sentenceCase(item.factSummary.replace(/^i /i, "").replace(/^yes[, ]*/i, ""));
          transparencyLog.push(
            createTransparencyEntry({
              id: `suggestion-${index}`,
              change: `Suggested new bullet: ${text}`,
              reason: "Generated from a user-verified answer tied to a hard gap.",
              mode,
              sourceType: "verified-answer",
              sourceLabel: item.question,
              status: "pending"
            })
          );
          return {
            id: `suggestion-${index}`,
            target,
            text,
            reason: "Mapped from verified interview answer.",
            sourceType: "verified-answer",
            sourceLabel: item.question,
            status: "pending"
          };
        })
      : [];

  return {
    summary,
    contactName: structuredResume.contactInfo?.name || "Candidate",
    contactLine: buildContactLine(structuredResume.contactInfo),
    sections,
    suggestedBullets,
    transparencyLog
  };
}

async function runSelfCheck({ originalResume, verifiedFacts, improvedJson, runContext }) {
  return callOpenAIJson({
    taskName: "rewrite-self-check",
    runContext,
    systemPrompt: buildSelfCheckPrompt(),
    userPrompt: JSON.stringify({ originalResume, verifiedFacts, improvedJson }, null, 2),
    fallback: () => {
      const renderedText = [
        improvedJson.summary,
        ...(improvedJson.sections || []).flatMap((section) =>
          section.type === "entries"
            ? section.items.flatMap((item) => [item.title, item.subtitle, ...(item.bullets || []).map((bullet) => bullet.text || bullet)])
            : section.items
        )
      ]
        .filter(Boolean)
        .join(" ");

      const issues = [];
      const wordCount = renderedText.split(/\s+/).filter(Boolean).length;

      if (wordCount < 200) {
        issues.push("Rewrite is under 200 words.");
      }

      if ((originalResume.workExperience || []).length > 0 && !improvedJson.sections.some((section) => section.id === "experience")) {
        issues.push("Original experience entries are missing.");
      }

      if ((improvedJson.transparencyLog || []).some((entry) => !["original", "verified-answer"].includes(entry.sourceType))) {
        issues.push("Unsupported source detected.");
      }

      return {
        passed: issues.length === 0,
        issues,
        wordCount
      };
    }
  });
}

async function generateResumeRewrite({
  mode,
  structuredResume,
  jobProfile,
  mismatchMatrix,
  verificationLogs,
  runContext
}) {
  const fallback = () => buildFallbackRewrite({ structuredResume, jobProfile, verificationLogs, mode });

  let improvedJson = await callOpenAIJson({
    taskName: `rewrite-${mode.toLowerCase()}`,
    runContext,
    systemPrompt: buildRewriteResumePrompt(),
    userPrompt: JSON.stringify({ mode, structuredResume, jobProfile, mismatchMatrix, verificationLogs }, null, 2),
    fallback
  });

  improvedJson.transparencyLog = improvedJson.transparencyLog || [];

  let selfCheck = await runSelfCheck({
    originalResume: structuredResume,
    verifiedFacts: verificationLogs,
    improvedJson,
    runContext
  });

  if (!selfCheck.passed) {
    improvedJson = fallback();
    improvedJson.transparencyLog = improvedJson.transparencyLog || [];
    selfCheck = await runSelfCheck({
      originalResume: structuredResume,
      verifiedFacts: verificationLogs,
      improvedJson,
      runContext
    });
  }

  const htmlVersion = renderResumeHtml(improvedJson);

  return {
    improvedJson,
    htmlVersion,
    transparencyLog: improvedJson.transparencyLog || [],
    selfCheck
  };
}

function applySuggestionDecision(improvedResumeRecord, suggestionId, decision) {
  const improvedJson = improvedResumeRecord.improvedJson;
  const suggestions = improvedJson.suggestedBullets || [];
  const suggestion = suggestions.find((item) => item.id === suggestionId);

  if (!suggestion) {
    return improvedResumeRecord;
  }

  suggestion.status = decision;

  if (decision === "accepted") {
    const experienceSection = improvedJson.sections.find((section) => section.id === "experience");
    if (experienceSection?.items?.length) {
      experienceSection.items[0].bullets.push({ text: suggestion.text, suggested: true });
    }
  }

  const logEntry = improvedJson.transparencyLog?.find((item) => item.id === suggestionId);
  if (logEntry) {
    logEntry.status = decision;
  }

  return {
    ...improvedResumeRecord,
    improvedJson,
    htmlVersion: renderResumeHtml(improvedJson),
    transparencyLogJson: improvedJson.transparencyLog || []
  };
}

module.exports = {
  generateResumeRewrite,
  applySuggestionDecision
};
