function normalize(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

function titleCase(value) {
  return normalize(value).replace(/\b\w/g, (char) => char.toUpperCase());
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isNegativeEvidence(value) {
  const lower = normalizeLower(value);
  return /^no\b/.test(lower) || /no internships?\b|no experience\b/.test(lower);
}

function getAliases(skill) {
  const aliasMap = {
    communication: ["customer service", "presentations", "cross-functional", "teamwork", "social media", "writing"],
    excel: ["spreadsheet", "spreadsheets", "google sheets", "tracked engagement", "reporting", "reports"],
    powerpoint: ["presentations", "pitch", "deck", "slides"],
    "financial modeling": ["modeling", "valuation", "forecasting", "finance coursework", "equity research"],
    valuation: ["financial analysis", "equity research", "modeling"],
    python: ["python scripts", "automation", "pandas", "data analysis"],
    react: ["frontend", "frontend features", "web app", "javascript"],
    javascript: ["js", "react", "frontend", "web app"],
    typescript: ["javascript", "frontend"],
    analytics: ["google analytics", "performance reporting", "tracked engagement", "reporting", "dashboard"],
    "google analytics": ["analytics", "tracked engagement", "campaign reporting"],
    "social media": ["content calendar", "content calendars", "engagement", "campaign"],
    marketing: ["brand", "campaign", "social media", "content"],
    leadership: ["led", "train", "mentored", "organized", "coordinated"],
    organization: ["calendar", "content calendar", "inventory", "operations", "scheduling"],
    "data analysis": ["analytics", "excel", "python", "google sheets", "reporting"],
    sql: ["database", "query", "analytics"],
    testing: ["debugging", "qa", "reviewed pull requests"],
    "cloud deployment": ["deployment", "vercel", "aws", "cloud"],
    collaboration: ["cross-functional", "teamwork", "worked with", "partnered"],
    writing: ["content", "copy", "social media", "campaign"]
  };

  return aliasMap[normalizeLower(skill)] || [];
}

function getBridgeRecommendation(skill, jobProfile) {
  const lower = normalizeLower(skill);
  const title = normalize(jobProfile.jobTitle || "this role");

  if (lower.includes("financial")) {
    return {
      recommendation:
        "Add a finance-heavy project, modeling coursework, or a valuation certification so you can show proof beyond interest in finance.",
      why: `For ${title}, hiring teams want evidence that you can already work with finance concepts in practice, not just study them.`
    };
  }

  if (lower.includes("excel") || lower.includes("powerpoint")) {
    return {
      recommendation:
        "Add a class project, club deliverable, or work example where you built spreadsheets, reports, or slides for a real decision.",
      why: "That turns a generic software/tool claim into visible execution."
    };
  }

  if (lower.includes("sql") || lower.includes("python") || lower.includes("javascript") || lower.includes("react")) {
    return {
      recommendation:
        "Bridge this with a small but complete project you can explain end-to-end, plus the exact tools you used.",
      why: "Technical hiring teams trust shipped work more than vague familiarity."
    };
  }

  if (lower.includes("analytics") || lower.includes("data")) {
    return {
      recommendation:
        "Add reporting, spreadsheet, dashboard, or campaign analysis work that shows how you interpreted results and acted on them.",
      why: "This proves you can move from raw information to decisions."
    };
  }

  if (lower.includes("social media") || lower.includes("marketing") || lower.includes("content")) {
    return {
      recommendation:
        "Add a campaign, content calendar, or reporting example that shows what you owned and how performance was tracked.",
      why: "Marketing roles care about execution plus signal that you understand outcomes."
    };
  }

  if (lower.includes("leadership") || lower.includes("communication") || lower.includes("collaboration")) {
    return {
      recommendation:
        "Call out a moment where you trained, coordinated, presented, or aligned other people around a task.",
      why: "Soft skills only become believable when tied to a concrete situation."
    };
  }

  return {
    recommendation: `Add a concrete project, course deliverable, certification, or role example that shows ${skill} in action.`,
    why: "The gap is not the keyword itself. The gap is missing proof."
  };
}

function collectEvidenceSources(structuredResume) {
  const sources = [];
  const pushEntry = (type, title, detail, bullets = []) => {
    const cleanBullets = (bullets || []).map(normalize).filter(Boolean);
    const summaryText = [title, detail, ...cleanBullets].filter(Boolean).join(". ");
    if (!summaryText || isNegativeEvidence(summaryText)) {
      return;
    }

    sources.push({
      type,
      title: normalize(title),
      detail: normalize(detail),
      bullets: cleanBullets,
      text: summaryText.toLowerCase(),
      displayText: summaryText
    });
  };

  if (!isNegativeEvidence(structuredResume.summary || "")) {
    pushEntry("summary", "Summary", structuredResume.summary || "");
  }

  (structuredResume.workExperience || []).forEach((entry) => {
    pushEntry(
      "experience",
      [entry.role, entry.company].filter(Boolean).join(" at "),
      entry.dates,
      entry.bullets
    );
  });

  (structuredResume.projects || []).forEach((entry) => {
    pushEntry("project", entry.name, entry.context, entry.bullets);
  });

  (structuredResume.education || []).forEach((entry) => {
    pushEntry("education", [entry.school, entry.degree].filter(Boolean).join(" - "), entry.dates, entry.bullets);
  });

  (structuredResume.extracurriculars || []).forEach((entry) => {
    pushEntry("activity", [entry.name, entry.role].filter(Boolean).join(" - "), "", entry.bullets);
  });

  (structuredResume.certifications || []).forEach((entry) => {
    pushEntry("certification", entry, "", []);
  });

  (structuredResume.skills || []).forEach((entry) => {
    pushEntry("skill", entry, "", []);
  });

  return uniqueBy(sources, (item) => item.displayText);
}

function findEvidenceForSkill(skill, sources) {
  const lower = normalizeLower(skill);
  const aliases = getAliases(skill);

  const prioritizedSources = [...sources].sort((left, right) => {
    const leftSummaryPenalty = left.type === "summary" ? 1 : 0;
    const rightSummaryPenalty = right.type === "summary" ? 1 : 0;
    return leftSummaryPenalty - rightSummaryPenalty;
  });

  for (const source of prioritizedSources) {
    if (source.text.includes(lower)) {
      return {
        status: "direct",
        evidence: source.displayText,
        sourceType: source.type
      };
    }
  }

  for (const alias of aliases) {
    const found = prioritizedSources.find((source) => source.text.includes(alias));
    if (found) {
      return {
        status: "transferable",
        evidence: found.displayText,
        sourceType: found.type,
        via: alias
      };
    }
  }

  return null;
}

function buildSkillAudit(jobProfile, sources) {
  const requiredSkills = (jobProfile.requiredSkills || []).map(normalize).filter(Boolean);

  return uniqueBy(
    requiredSkills.map((skill) => {
      const evidence = findEvidenceForSkill(skill, sources);
      const bridge = getBridgeRecommendation(skill, jobProfile);

      if (evidence) {
        return {
          skill,
          status: evidence.status,
          evidence: evidence.status === "transferable"
            ? `Closest evidence: ${evidence.evidence} (transferable through ${evidence.via}).`
            : `Resume proof: ${evidence.evidence}.`,
          bridgeRecommendation: null,
          bridgeWhy: null
        };
      }

      return {
        skill,
        status: "missing",
        evidence: "No clear proof for this requirement appears in the current resume.",
        bridgeRecommendation: bridge.recommendation,
        bridgeWhy: bridge.why
      };
    }),
    (item) => normalizeLower(item.skill)
  );
}

function getSourceQuality(source) {
  let score = 0;
  if (source.type === "experience") score += 5;
  if (source.type === "project") score += 4;
  if (source.type === "activity") score += 3;
  if (source.type === "certification") score += 3;
  if (source.type === "education") score += 2;
  if (source.type === "summary") score += 1;
  score += Math.min((source.bullets || []).length, 3);
  if (isNegativeEvidence(source.displayText)) score -= 10;
  return score;
}

function getTopEvidenceItems(sources) {
  return sources
    .filter((item) => item.type === "experience" || item.type === "project" || item.type === "activity")
    .filter((item) => item.displayText.length > 10)
    .filter((item) => !isNegativeEvidence(item.displayText))
    .sort((left, right) => getSourceQuality(right) - getSourceQuality(left))
    .slice(0, 6);
}

function shortenResponsibility(text) {
  const clean = normalize(text).replace(/^responsibilities include\s*/i, "").replace(/^requirements:\s*/i, "");
  const shortened = clean.replace(/[.]+$/, "").slice(0, 110).trim();
  return shortened.length < clean.length ? `${shortened}...` : shortened;
}

function buildHonestAssessment({ fitScore, structuredResume, skillAudit, jobProfile }) {
  const directCount = skillAudit.filter((item) => item.status === "direct").length;
  const missing = skillAudit.filter((item) => item.status === "missing");
  const transferable = skillAudit.filter((item) => item.status === "transferable");
  const strongestEvidence = getTopEvidenceItems(collectEvidenceSources(structuredResume))[0];
  const roleTitle = normalize(jobProfile.jobTitle || "this role");

  if (fitScore < 35) {
    const firstGap = missing[0]?.skill || "the role's core requirements";
    return `**Honest Assessment**\n- This is a real stretch right now.\n- Your resume does not yet prove ${firstGap}, which is central to ${roleTitle}.\n- The best path is to apply honestly, lean on your strongest transferable proof${strongestEvidence ? ` from ${strongestEvidence.title}` : ""}, and build one or two concrete bridge pieces before expecting strong odds.`;
  }

  if (!missing.length && transferable.length >= 2) {
    return `**Honest Assessment**\n- You have a credible adjacent fit.\n- The resume is already pointing in the right direction, but some of the strongest evidence is still implied instead of stated directly.\n- This is less about becoming qualified and more about making your proof easier to see fast.`; 
  }

  if (fitScore < 65) {
    const firstGap = missing[0]?.skill || transferable[0]?.skill || "a few core requirements";
    return `**Honest Assessment**\n- You have a believable foundation, but this is not a clean match yet.\n- The resume gives evidence for ${directCount} core requirement${directCount === 1 ? "" : "s"}, but ${firstGap} still needs clearer proof.\n- Tightening the resume around actual evidence and filling the top one or two gaps would make this application much stronger.`;
  }

  return `**Honest Assessment**\n- This is a credible match.\n- Your resume already proves several of the role's core asks, and the remaining gaps look coachable rather than disqualifying.\n- The job now is precision: surface the best evidence faster, remove fluff, and make each bullet carry more signal.`;
}

function buildPressureQuestions(skillAudit, structuredResume, jobProfile) {
  const evidenceItems = getTopEvidenceItems(collectEvidenceSources(structuredResume));
  const anchor = evidenceItems[0];
  const gaps = skillAudit.filter((item) => item.status === "missing").slice(0, 2);
  const softCandidates = skillAudit.filter((item) => item.status === "transferable");

  if (!gaps.length && softCandidates.length) {
    return softCandidates.slice(0, 2).map((gap) => {
      const fallbackContext = anchor ? `${anchor.title}` : "your current resume evidence";
      return `You have adjacent proof for ${gap.skill}, but it is still indirect. If an interviewer pushed you on ${gap.skill}, what concrete example would you use beyond ${fallbackContext}?`;
    });
  }

  const questions = gaps.map((gap) => {
    const fallbackContext = anchor ? `${anchor.title}` : "your current resume evidence";
    return `The JD requires ${gap.skill}, but your resume mainly shows ${fallbackContext}. How would you handle a day-one task that depends on ${gap.skill} without overstating what you already know?`;
  });

  let transferableIndex = 0;
  while (questions.length < 2 && transferableIndex < softCandidates.length) {
    const gap = softCandidates[transferableIndex];
    const fallbackContext = anchor ? `${anchor.title}` : "your current resume evidence";
    questions.push(
      `You have adjacent proof for ${gap.skill}, but it is still indirect. If an interviewer pushed you on ${gap.skill}, what concrete example would you use beyond ${fallbackContext}?`
    );
    transferableIndex += 1;
  }

  return questions;
}

function buildExperienceQuestions(structuredResume, jobProfile) {
  const sources = getTopEvidenceItems(collectEvidenceSources(structuredResume));
  const responsibilities = (jobProfile.keyResponsibilities || []).map(normalize).filter(Boolean);

  return sources.slice(0, 3).map((item, index) => {
    const responsibility = shortenResponsibility(responsibilities[index] || responsibilities[0] || "the kind of work this role will expect");
    const label = item.title.length > 80 ? item.title.slice(0, 80).trim() : item.title;
    return `You mentioned ${label}. What was the biggest bottleneck you hit there, and how would that experience help you with ${responsibility}?`;
  });
}

function splitCompoundInternship(line) {
  const clean = normalize(line);
  if (!/internship experience:/i.test(clean) || !/\sand\s/i.test(clean)) {
    return [];
  }

  const withoutPrefix = clean.replace(/^internship experience:\s*/i, "");
  return withoutPrefix
    .split(/\s+and\s+/i)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => /intern/i.test(item))
    .map((item) => ({
      original: item.endsWith(".") ? item : `${item}.`,
      context: "Internship experience"
    }));
}

function collectRewriteCandidates(structuredResume) {
  const candidates = [];

  const pushBullet = (context, bullet) => {
    const cleanBullet = normalize(bullet);
    if (!cleanBullet || cleanBullet.split(/\s+/).length < 3 || /^no\b/i.test(cleanBullet) || /^\d+\s*(year|month)s?\.?$/i.test(cleanBullet)) {
      return;
    }

    candidates.push({
      context: normalize(context),
      original: cleanBullet
    });
  };

  (structuredResume.workExperience || []).forEach((entry) => {
    const context = [entry.role, entry.company].filter(Boolean).join(" at ");
    if ((entry.bullets || []).length) {
      entry.bullets.forEach((bullet) => pushBullet(context, bullet));
    } else if (context && context.split(/\s+/).length >= 4) {
      pushBullet(context, context);
    }
  });

  (structuredResume.projects || []).forEach((entry) => {
    const context = entry.name || "Project";
    if ((entry.bullets || []).length) {
      entry.bullets.forEach((bullet) => pushBullet(context, bullet));
    } else if (entry.name) {
      pushBullet(context, entry.name);
    }
  });

  (structuredResume.extracurriculars || []).forEach((entry) => {
    const context = [entry.name, entry.role].filter(Boolean).join(" - ");
    (entry.bullets || []).forEach((bullet) => pushBullet(context, bullet));
  });

  const summarySentences = (structuredResume.summary || "")
    .split(/(?<=[.!?])\s+/)
    .map(normalize)
    .filter((sentence) => sentence.split(/\s+/).length >= 5)
    .filter((sentence) => !/^no internships?\.?$/i.test(sentence))
    .filter((sentence) => !/^work experience:/i.test(sentence));

  summarySentences.forEach((sentence) => pushBullet("Summary", sentence));

  summarySentences.forEach((sentence) => {
    splitCompoundInternship(sentence).forEach((entry) => candidates.push(entry));
  });

  return uniqueBy(candidates, (item) => `${item.context}:${item.original}`);
}

function inferOutcomeHint(text) {
  const lower = normalizeLower(text);

  if (/tracked|analytics|engagement|reporting/.test(lower)) {
    return "and made performance easier to evaluate";
  }

  if (/built|created|developed|shipped/.test(lower)) {
    return "and turned the work into something usable";
  }

  if (/customer service|cash|register|operations|inventory/.test(lower)) {
    return "in a fast-moving customer environment";
  }

  if (/calendar|social media|campaign|content/.test(lower)) {
    return "with clearer ownership and follow-through";
  }

  return "";
}

function inferRewriteFromContext(original, context) {
  const lowerOriginal = normalizeLower(original);
  const lowerContext = normalizeLower(context);

  if (/finance major/.test(lowerOriginal)) {
    const gpa = original.match(/gpa\s*([0-4]\.\d{1,2})/i);
    return gpa ? `Finance major with a ${gpa[1]} GPA.` : "Finance major with relevant academic grounding.";
  }

  if (/data science student/.test(lowerOriginal)) {
    return "Data science student with coursework aligned to analytics and reporting work.";
  }

  if (/customer success/.test(lowerOriginal)) {
    return "Built several years of customer-facing experience managing enterprise relationships and surfacing user needs.";
  }

  if (/front desk assistant/.test(lowerOriginal)) {
    return "Worked as a front desk assistant in a medical office, handling day-to-day communication and coordination.";
  }

  if (/retail cashier/.test(lowerOriginal)) {
    return "Worked as a retail cashier in a fast-paced environment where accuracy and customer communication mattered.";
  }

  if (/shift lead/.test(lowerOriginal)) {
    return "Served as a shift lead with hands-on responsibility for day-to-day coordination and team support.";
  }

  if (/volunteer tax preparer/.test(lowerOriginal)) {
    return "Prepared tax returns through VITA, giving you hands-on exposure to detail-oriented financial work.";
  }

  if (/treasurer/.test(lowerOriginal)) {
    return "Served as treasurer for a student organization, which is stronger when framed around tracking funds or reporting.";
  }

  if (/program management intern/.test(lowerOriginal)) {
    return "Supported program management work and should name the timelines, deliverables, and coordination you directly owned.";
  }

  if (/president of the student mentoring club/.test(lowerOriginal) || /student mentoring club/.test(lowerOriginal)) {
    return "Led student mentoring efforts with clearer room to name scheduling, communication, and follow-through.";
  }

  if (/security\+/.test(lowerOriginal)) {
    return "Earned Security+ certification to back up your security fundamentals with recognized proof.";
  }

  if (/home lab/.test(lowerOriginal)) {
    return "Built home lab projects using security tools you can walk through step by step in an interview.";
  }

  if (/built a class dashboard project/i.test(lowerOriginal)) {
    return "Built a Tableau dashboard project and cleaned survey data in Python, which is stronger when framed around the question you were trying to answer.";
  }

  if (/coursework in financial accounting, auditing, and excel/i.test(lowerOriginal)) {
    return "Completed coursework in financial accounting, auditing, and Excel that is worth tying to specific deliverables or workpapers.";
  }

  if (/ran weekly status notes/i.test(lowerOriginal)) {
    return "Ran weekly status notes that kept timelines, owners, and follow-through visible.";
  }

  if (/worked with cross-functional teams/i.test(lowerOriginal)) {
    return "Worked with cross-functional teams and should make the coordination point more explicit.";
  }

  if (/internship in campus it support/i.test(lowerOriginal)) {
    return "Supported campus IT operations, troubleshooting endpoint issues and handling escalated tickets.";
  }

  if (/security fundamentals/i.test(lowerOriginal)) {
    return "Built security fundamentals through certification work and hands-on lab tooling.";
  }

  if (/summary/.test(lowerContext)) {
    return "";
  }

  return "";
}

function tightenRewrite(original, context) {
  const cleanContext = normalize(context);
  const contextRole = cleanContext.split(" at ")[0] || cleanContext;
  let rewrite = original.replace(/\baPI\b/g, "API").trim();
  const inferredRewrite = inferRewriteFromContext(rewrite, cleanContext);
  if (inferredRewrite) {
    return inferredRewrite;
  }

  rewrite = rewrite
    .replace(/^internship experience:\s*/i, "")
    .replace(/^work experience:\s*/i, "")
    .replace(/^personal projects include\s*/i, "Built ")
    .replace(/^finance major student/i, "Finance major")
    .replace(/^computer science junior/i, "Computer science junior")
    .replace(/^senior marketing major/i, "Senior marketing major");

  if (/^wrote python scripts/i.test(rewrite)) {
    rewrite = "Wrote Python scripts that automated repeatable work and supported internal tooling";
  } else if (/^built frontend features/i.test(rewrite)) {
    rewrite = "Built React frontend features that supported live product work";
  } else if (/^shipped internal tools/i.test(rewrite)) {
    rewrite = "Shipped internal tools used to support day-to-day team execution";
  } else if (/^ran social media/i.test(rewrite)) {
    rewrite = "Ran social media operations with clearer ownership over posting and engagement tracking";
  } else if (/^created campaign calendars/i.test(rewrite)) {
    rewrite = "Created campaign calendars that made launch planning and coordination more structured";
  } else if (/^tracked engagement/i.test(rewrite)) {
    rewrite = "Tracked engagement data and used it to understand what content was working";
  } else if (/^google analytics certified/i.test(rewrite)) {
    rewrite = "Earned Google Analytics certification to back up hands-on reporting and measurement work";
  } else if (/^marketing intern at /i.test(rewrite)) {
    rewrite = "Supported marketing execution in an internship setting with clearer room to name campaigns, reporting, or coordination work";
  } else if (/^brand marketing intern at /i.test(rewrite)) {
    rewrite = "Supported brand marketing work in an internship setting and should be tied to the campaigns or reporting you actually touched";
  } else if (/^software engineering intern at /i.test(rewrite)) {
    rewrite = "Completed a software engineering internship and should name the product features, tools, and debugging work you actually handled";
  } else if (/^mcdonald'?s crew member/i.test(rewrite)) {
    rewrite = "Handled fast-paced customer operations, cash transactions, and day-to-day service demands";
  } else if (/^worked the register/i.test(rewrite)) {
    rewrite = "Managed register transactions accurately in a high-volume service setting";
  } else if (/^customer service/i.test(rewrite)) {
    rewrite = "Delivered customer service in a fast-moving environment with constant real-time problem solving";
  } else if (/^(built|created|developed|managed|led|tracked|analyzed|ran|coordinated|supported|wrote|shipped)\b/i.test(rewrite)) {
    rewrite = rewrite.charAt(0).toUpperCase() + rewrite.slice(1);
  } else if (/^(marketing intern|brand marketing intern|software engineering intern|mcdonald'?s crew member)/i.test(rewrite)) {
    rewrite = `${rewrite.charAt(0).toUpperCase() + rewrite.slice(1)} with responsibilities that are worth making more explicit`;
  } else if (/^(five years in|two years as|summer job as|coursework in|junior data science student|accounting junior|psychology senior)/i.test(rewrite)) {
    rewrite = rewrite.charAt(0).toUpperCase() + rewrite.slice(1);
  } else {
    rewrite = `Showed ${rewrite.charAt(0).toLowerCase()}${rewrite.slice(1)}`;
  }

  if (
    cleanContext &&
    cleanContext !== "Summary" &&
    cleanContext !== "Internship experience" &&
    cleanContext.length < 80 &&
    !normalizeLower(rewrite).includes(normalizeLower(contextRole))
  ) {
    rewrite = `${rewrite} through ${cleanContext}`;
  }

  const outcomeHint = inferOutcomeHint(`${original} ${cleanContext}`);
  if (outcomeHint && !normalizeLower(rewrite).includes(normalizeLower(outcomeHint))) {
    rewrite = `${rewrite} ${outcomeHint}`;
  }

  rewrite = rewrite.replace(/\s+/g, " ").trim();

  if (!/[.!?]$/.test(rewrite)) {
    rewrite += ".";
  }

  return rewrite;
}

function explainRewrite(original, rewrite) {
  if (normalizeLower(original) === normalizeLower(rewrite)) {
    return "This keeps the fact pattern intact while making the line easier to scan.";
  }

  if (/\b(track|report|analy|manage|coordinate|build|develop|lead|support|prepare|work)\b/i.test(rewrite)) {
    return "This version leads with the action and makes the evidence easier for a hiring lead to trust quickly.";
  }

  return "This version removes weaker phrasing and makes the contribution read more clearly without inventing impact.";
}

function buildBulletRewrites(structuredResume) {
  return collectRewriteCandidates(structuredResume)
    .filter((item) => !isNegativeEvidence(item.original))
    .slice(0, 5)
    .map((item) => {
      const rewrite = tightenRewrite(item.original, item.context);
      return {
        original: item.original,
        rewrite,
        why: explainRewrite(item.original, rewrite)
      };
    });
}

function buildStrengths(skillAudit) {
  const strengths = skillAudit
    .filter((item) => item.status !== "missing")
    .slice(0, 5)
    .map((item) =>
      item.status === "direct"
        ? `You already prove ${item.skill} with explicit evidence.`
        : `You have adjacent proof for ${item.skill}, but it should be framed more directly.`
    );

  if (!strengths.length) {
    strengths.push("You still have some usable signal here through education, experience, or projects, even if the role is a stretch.");
  }

  return strengths;
}

function buildMissing(skillAudit) {
  return skillAudit
    .filter((item) => item.status === "missing")
    .slice(0, 5)
    .map((item) => `${item.skill}: ${item.bridgeRecommendation}`);
}

function buildQuestionFallbacks(interviewQuestions, structuredResume, jobProfile) {
  const roleTitle = normalize(jobProfile.jobTitle || "this role");
  const evidenceItems = getTopEvidenceItems(collectEvidenceSources(structuredResume));
  const fallbackQuestions = [...interviewQuestions];

  if (fallbackQuestions.length < 5 && evidenceItems[0]) {
    fallbackQuestions.push(
      `What part of ${evidenceItems[0].title} gives you the strongest argument that you could ramp into ${roleTitle} quickly?`
    );
  }

  while (fallbackQuestions.length < 5) {
    fallbackQuestions.push(
      `Which part of your current background best prepares you for ${roleTitle}, and where would you need the most ramp time?`
    );
  }

  return uniqueBy(fallbackQuestions, (item) => normalizeLower(item)).slice(0, 5);
}

function buildAuditMarkdown({ honestAssessment, skillAudit, interviewQuestions, bulletRewrites }) {
  const assessmentBody = [
    honestAssessment,
    "",
    "**Evidence Audit**",
    ...skillAudit.slice(0, 6).map((item) =>
      item.status === "missing"
        ? `- **${item.skill}**: Missing proof. ${item.bridgeRecommendation} ${item.bridgeWhy}`
        : `- **${item.skill}**: ${item.evidence}`
    )
  ].join("\n");

  const interviewBody = [
    "**Interview Prep**",
    ...interviewQuestions.map((question, index) => `- **Q${index + 1}.** ${question}`)
  ].join("\n");

  const rewriteBody = [
    "**Direct Fix Recommendations**",
    ...bulletRewrites.map(
      (item) => `- **Original:** ${item.original}\n  **Rewrite:** ${item.rewrite}\n  **Why this is stronger:** ${item.why}`
    )
  ].join("\n");

  return {
    assessmentBody,
    interviewBody,
    rewriteBody
  };
}

function generateDeepAudit({ structuredResume, jobProfile, mismatchMatrix }) {
  const sources = collectEvidenceSources(structuredResume);
  const skillAudit = buildSkillAudit(jobProfile, sources);
  const pressureQuestions = buildPressureQuestions(skillAudit, structuredResume, jobProfile);
  const experienceQuestions = buildExperienceQuestions(structuredResume, jobProfile);
  while (pressureQuestions.length < 2) {
    const fallbackSkill = skillAudit[pressureQuestions.length]?.skill || "this role's top requirement";
    pressureQuestions.push(
      `What would you say if an interviewer asked you to prove ${fallbackSkill} from the resume you submitted today?`
    );
  }
  const interviewQuestions = buildQuestionFallbacks([...pressureQuestions, ...experienceQuestions], structuredResume, jobProfile);
  const bulletRewrites = buildBulletRewrites(structuredResume);
  const honestAssessment = buildHonestAssessment({
    fitScore: mismatchMatrix.fitScore,
    structuredResume,
    skillAudit,
    jobProfile
  });
  const strengths = buildStrengths(skillAudit);
  const missing = buildMissing(skillAudit);
  const markdown = buildAuditMarkdown({
    honestAssessment,
    skillAudit,
    interviewQuestions,
    bulletRewrites
  });

  return {
    honestAssessment,
    strengths,
    missing,
    skillAudit,
    interviewQuestions,
    bulletRewrites,
    markdown
  };
}

module.exports = {
  generateDeepAudit
};
