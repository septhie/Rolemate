const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const prisma = require("../utils/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { createRunContext, devLog } = require("../utils/logger");
const { sha256 } = require("../utils/hash");
const { extractResumeText } = require("../modules/FileIngestion");
const { validateJobDescription } = require("../modules/JobDescriptionInput");
const { parseResume } = require("../modules/ResumeParser");
const { analyzeJobDescription } = require("../modules/JobAnalyzer");
const { buildMismatchMatrix } = require("../modules/MismatchMatrix");
const { generateGapAnalysis } = require("../modules/GapAnalysis");
const { generateVerificationQuestions, verifyInterviewAnswer } = require("../modules/VerificationAgent");
const { generateResumeRewrite, applySuggestionDecision } = require("../modules/RewriteEngine");
const { assertUsageAllowed, recordCompletedReview } = require("../modules/UsageTracker");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const router = express.Router();

function summarizeRun({ resumeText, jobDescription, mismatchMatrix, verificationLogs, rewriteMode, rewriteGenerated, runContext }) {
  return {
    resumeWordCount: resumeText.split(/\s+/).filter(Boolean).length,
    jdWordCount: jobDescription.split(/\s+/).filter(Boolean).length,
    fitScore: mismatchMatrix.fitScore,
    keywordMatchPercent: mismatchMatrix.breakdown.keywordMatchPercent,
    directMatches: mismatchMatrix.directMatches.length,
    softGaps: mismatchMatrix.softGaps.length,
    hardGaps: mismatchMatrix.hardGaps.length,
    verificationQuestionsAsked: verificationLogs.length,
    verificationQuestionsAnswered: verificationLogs.filter((item) => item.userAnswer).length,
    rewriteMode,
    rewriteGenerated,
    totalApiCallsMade: runContext.apiCallsMade,
    totalTimeMs: Date.now() - runContext.startedAt
  };
}

function serializeAnalysis(record) {
  return {
    id: record.id,
    createdAt: record.createdAt,
    fitScore: record.fitScore,
    mismatchMatrix: record.mismatchMatrixJson,
    strengths: record.strengthsJson,
    weaknesses: record.weaknessesJson,
    missingKeywords: record.missingKeywordsJson,
    redFlags: record.redFlagsJson,
    summary: record.summary,
    resume: record.resume,
    jobProfile: record.jobProfile,
    verificationLogs: record.verificationLogs,
    improvedResumes: record.improvedResumes || []
  };
}

async function persistUploadedPdf(file) {
  if (!file) {
    return null;
  }

  // Vercel's filesystem is ephemeral, so we skip local file persistence in production.
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return null;
  }

  const uploadDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, file.buffer);
  return filePath;
}

router.post(
  "/",
  upload.single("resumePdf"),
  asyncHandler(async (req, res) => {
    const runContext = createRunContext();
    const { manualResumeText, jobDescription, jobTitle, companyName } = req.body;
    const normalizedJobDescription = validateJobDescription(jobDescription);
    const ingestion = await extractResumeText({
      file: req.file,
      manualText: manualResumeText
    });

    devLog("resume-text-extraction", ingestion);

    const cacheKey = sha256(
      JSON.stringify({
        resume: ingestion.extractedText,
        jobDescription: normalizedJobDescription,
        jobTitle: jobTitle || "",
        companyName: companyName || ""
      })
    );

    const cached = await prisma.analysis.findUnique({
      where: { cacheKey },
      include: {
        resume: true,
        jobProfile: true,
        verificationLogs: true,
        improvedResumes: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (cached) {
      return res.json({
        review: serializeAnalysis(cached),
        cached: true,
        usage: req.user ? null : null
      });
    }

    // We allow exact duplicate submissions to short-circuit to the cached result before
    // enforcing the anonymous free limit so repeat refreshes do not consume extra reviews.
    assertUsageAllowed(req);

    const [structuredResume, parsedJobProfile] = await Promise.all([
      parseResume(ingestion.extractedText, runContext),
      analyzeJobDescription({
        jobDescription: normalizedJobDescription,
        jobTitle,
        companyName,
        runContext
      })
    ]);

    devLog("jd-parsing-summary", parsedJobProfile);

    const mismatchMatrix = buildMismatchMatrix(structuredResume, parsedJobProfile);
    devLog("mismatch-matrix", mismatchMatrix);
    devLog("fit-score", mismatchMatrix.breakdown);

    const [gapAnalysis, verificationQuestionResult] = await Promise.all([
      generateGapAnalysis({
        structuredResume,
        jobProfile: {
          ...parsedJobProfile,
          jobTitle,
          companyName
        },
        mismatchMatrix,
        runContext
      }),
      generateVerificationQuestions({
        hardGaps: mismatchMatrix.hardGaps,
        structuredResume,
        jobProfile: parsedJobProfile,
        runContext
      })
    ]);

    devLog("verification-questions", verificationQuestionResult);

    const originalPdfPath = await persistUploadedPdf(req.file);
    const runSummary = summarizeRun({
      resumeText: ingestion.extractedText,
      jobDescription: normalizedJobDescription,
      mismatchMatrix,
      verificationLogs: [],
      rewriteMode: null,
      rewriteGenerated: false,
      runContext
    });

    // Neon pooled connections can hang on interactive Prisma transactions in serverless,
    // so we persist the review with plain sequential writes instead.
    const resume = await prisma.resume.create({
      data: {
        userId: req.user?.id || null,
        originalPdfPath,
        extractedText: ingestion.extractedText,
        structuredJson: structuredResume
      }
    });

    const jobProfile = await prisma.jobProfile.create({
      data: {
        userId: req.user?.id || null,
        jobTitle: jobTitle || null,
        companyName: companyName || null,
        jobDescription: normalizedJobDescription,
        parsedJson: parsedJobProfile
      }
    });

    const analysis = await prisma.analysis.create({
      data: {
        resumeId: resume.id,
        jobProfileId: jobProfile.id,
        fitScore: mismatchMatrix.fitScore,
        mismatchMatrixJson: mismatchMatrix,
        strengthsJson: gapAnalysis.strengths,
        weaknessesJson: gapAnalysis.missing,
        missingKeywordsJson: mismatchMatrix.hardGaps.map((item) => item.value),
        redFlagsJson: {
          resumeWarnings: ingestion.warnings,
          parsedResumeFlags: structuredResume.flags,
          scannedLikely: ingestion.scannedLikely,
          honestAssessment: gapAnalysis.honestAssessment
        },
        cacheKey,
        summary: runSummary
      }
    });

    if ((verificationQuestionResult.questions || []).length) {
      await prisma.verificationLog.createMany({
        data: (verificationQuestionResult.questions || []).map((item) => ({
          analysisId: analysis.id,
          question: item.question,
          userAnswer: null,
          verified: false,
          factSummary: item.gap
        }))
      });
    }

    const review = await prisma.analysis.findUnique({
      where: { id: analysis.id },
      include: {
        resume: true,
        jobProfile: true,
        verificationLogs: true,
        improvedResumes: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    const usage = recordCompletedReview(req, res, analysis.id);
    devLog("run-summary", review.summary);

    res.status(201).json({
      review: serializeAnalysis(review),
      cached: false,
      usage
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const review = await prisma.analysis.findUnique({
      where: { id: req.params.id },
      include: {
        resume: true,
        jobProfile: true,
        verificationLogs: true,
        improvedResumes: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!review) {
      const error = new Error("Review not found.");
      error.statusCode = 404;
      throw error;
    }

    res.json({ review: serializeAnalysis(review) });
  })
);

router.post(
  "/:id/verification",
  asyncHandler(async (req, res) => {
    const { verificationLogId, answer } = req.body;
    if (!answer?.trim()) {
      const error = new Error("Please answer the question before submitting.");
      error.statusCode = 400;
      throw error;
    }

    const verificationLog = await prisma.verificationLog.findFirst({
      where: {
        id: verificationLogId,
        analysisId: req.params.id
      }
    });

    if (!verificationLog) {
      const error = new Error("Verification question not found.");
      error.statusCode = 404;
      throw error;
    }

    const runContext = createRunContext();
    const verificationResult = await verifyInterviewAnswer({
      question: verificationLog.question,
      answer,
      runContext
    });

    devLog("verification-answer", verificationResult);

    const updatedLog = await prisma.verificationLog.update({
      where: { id: verificationLog.id },
      data: {
        userAnswer: answer,
        verified: Boolean(verificationResult.verified),
        factSummary: verificationResult.factSummary || verificationLog.factSummary
      }
    });

    res.json({ verificationLog: updatedLog, result: verificationResult });
  })
);

router.post(
  "/:id/rewrite",
  asyncHandler(async (req, res) => {
    const mode = req.body.mode || "Strict";
    const allowedModes = ["Strict", "Suggestion", "Translation"];
    if (!allowedModes.includes(mode)) {
      const error = new Error("Unsupported rewrite mode.");
      error.statusCode = 400;
      throw error;
    }

    const review = await prisma.analysis.findUnique({
      where: { id: req.params.id },
      include: {
        resume: true,
        jobProfile: true,
        verificationLogs: true
      }
    });

    if (!review) {
      const error = new Error("Review not found.");
      error.statusCode = 404;
      throw error;
    }

    const runContext = createRunContext();
    const rewrite = await generateResumeRewrite({
      mode,
      structuredResume: review.resume.structuredJson,
      jobProfile: {
        ...review.jobProfile.parsedJson,
        jobTitle: review.jobProfile.jobTitle,
        companyName: review.jobProfile.companyName
      },
      mismatchMatrix: review.mismatchMatrixJson,
      verificationLogs: review.verificationLogs,
      runContext
    });

    devLog("rewrite-engine", {
      mode,
      usage: runContext.usage,
      retriesTriggered: runContext.retriesTriggered
    });

    const created = await prisma.improvedResume.create({
      data: {
        analysisId: review.id,
        resumeId: review.resumeId,
        jobProfileId: review.jobProfileId,
        mode,
        improvedJson: rewrite.improvedJson,
        htmlVersion: rewrite.htmlVersion,
        transparencyLogJson: rewrite.transparencyLog
      }
    });

    const summary = summarizeRun({
      resumeText: review.resume.extractedText,
      jobDescription: review.jobProfile.jobDescription,
      mismatchMatrix: review.mismatchMatrixJson,
      verificationLogs: review.verificationLogs,
      rewriteMode: mode,
      rewriteGenerated: true,
      runContext
    });

    await prisma.analysis.update({
      where: { id: review.id },
      data: { summary }
    });

    res.status(201).json({
      improvedResume: {
        ...created,
        improvedJson: rewrite.improvedJson,
        transparencyLogJson: rewrite.transparencyLog,
        selfCheck: rewrite.selfCheck
      },
      summary
    });
  })
);

router.post(
  "/improved/:id/decision",
  asyncHandler(async (req, res) => {
    const { suggestionId, decision } = req.body;
    if (!["accepted", "rejected"].includes(decision)) {
      const error = new Error("Decision must be accepted or rejected.");
      error.statusCode = 400;
      throw error;
    }

    const improvedResume = await prisma.improvedResume.findUnique({
      where: { id: req.params.id }
    });

    if (!improvedResume) {
      const error = new Error("Improved resume not found.");
      error.statusCode = 404;
      throw error;
    }

    const updated = applySuggestionDecision(improvedResume, suggestionId, decision);
    const saved = await prisma.improvedResume.update({
      where: { id: improvedResume.id },
      data: {
        improvedJson: updated.improvedJson,
        htmlVersion: updated.htmlVersion,
        transparencyLogJson: updated.transparencyLogJson
      }
    });

    res.json({ improvedResume: saved });
  })
);

module.exports = router;
