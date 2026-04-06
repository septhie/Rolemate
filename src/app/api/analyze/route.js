import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createRunContext, devLog } = require("../../../server/utils/logger");
const { extractResumeText } = require("../../../server/modules/FileIngestion");
const { validateJobDescription } = require("../../../server/modules/JobDescriptionInput");
const { parseResume } = require("../../../server/modules/ResumeParser");
const { analyzeJobDescription } = require("../../../server/modules/JobAnalyzer");
const { buildMismatchMatrix } = require("../../../server/modules/MismatchMatrix");
const { generateDeepAudit } = require("../../../server/modules/DeepAudit");
const { generateVerificationQuestions } = require("../../../server/modules/VerificationAgent");

export const runtime = "nodejs";
export const maxDuration = 60;

const statusMessages = [
  "Scanning for BS...",
  "Checking if you actually know Python...",
  "Preparing the harsh truth..."
];

function summarizeRun({ resumeText, jobDescription, mismatchMatrix, verificationLogs, runContext }) {
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
    rewriteMode: null,
    rewriteGenerated: false,
    totalApiCallsMade: runContext.apiCallsMade,
    totalTimeMs: Date.now() - runContext.startedAt
  };
}

function buildTransientReview({
  ingestion,
  structuredResume,
  parsedJobProfile,
  mismatchMatrix,
  deepAudit,
  verificationQuestionResult,
  jobTitle,
  companyName,
  normalizedJobDescription,
  runSummary
}) {
  const reviewId = crypto.randomUUID();

  return {
    id: reviewId,
    createdAt: new Date().toISOString(),
    fitScore: mismatchMatrix.fitScore,
    mismatchMatrix,
    strengths: deepAudit.strengths,
    weaknesses: deepAudit.missing,
    missingKeywords: mismatchMatrix.hardGaps.map((item) => item.value),
    redFlags: {
      resumeWarnings: ingestion.warnings,
      parsedResumeFlags: structuredResume.flags,
      scannedLikely: ingestion.scannedLikely,
      honestAssessment: deepAudit.honestAssessment
    },
    audit: {
      skillAudit: deepAudit.skillAudit,
      interviewQuestions: deepAudit.interviewQuestions,
      bulletRewrites: deepAudit.bulletRewrites
    },
    summary: runSummary,
    transient: true,
    resume: {
      id: `resume-${reviewId}`,
      extractedText: ingestion.extractedText,
      structuredJson: structuredResume
    },
    jobProfile: {
      id: `job-${reviewId}`,
      jobTitle: jobTitle || null,
      companyName: companyName || null,
      jobDescription: normalizedJobDescription,
      parsedJson: parsedJobProfile
    },
    verificationLogs: (verificationQuestionResult.questions || []).map((item, index) => ({
      id: `verify-${reviewId}-${index}`,
      question: item.question,
      userAnswer: null,
      verified: false,
      factSummary: item.gap
    })),
    improvedResumes: []
  };
}

async function toNodeFile(file) {
  if (!file) {
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();
  return {
    originalname: file.name,
    mimetype: file.type,
    size: file.size,
    buffer: Buffer.from(arrayBuffer)
  };
}

function createStreamEvent(encoder, event, payload) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamMarkdownSection(send, eventName, text) {
  if (!text) {
    return;
  }

  const chunks = String(text)
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    send(eventName, { chunk: `${chunk}\n\n` });
    await sleep(40);
  }
}

export async function POST(request) {
  const formData = await request.formData();
  const manualResumeText = formData.get("manualResumeText")?.toString() || "";
  const jobDescription = formData.get("jobDescription")?.toString() || "";
  const jobTitle = formData.get("jobTitle")?.toString() || "";
  const companyName = formData.get("companyName")?.toString() || "";
  const resumePdf = formData.get("resumePdf");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, payload) => controller.enqueue(createStreamEvent(encoder, event, payload));

      try {
        const runContext = createRunContext();
        const normalizedJobDescription = validateJobDescription(jobDescription);
        const file = resumePdf instanceof File ? await toNodeFile(resumePdf) : null;
        const ingestion = await extractResumeText({
          file,
          manualText: manualResumeText
        });

        devLog("resume-text-extraction", ingestion);
        send("status", { message: statusMessages[0] });
        send("assessment", {
          chunk:
            "**Honest Assessment**\n- Reading the resume against the job requirements now.\n- I am looking for proof, not vibe.\n\n"
        });

        const [structuredResume, parsedJobProfile] = await Promise.all([
          parseResume(ingestion.extractedText, runContext),
          analyzeJobDescription({
            jobDescription: normalizedJobDescription,
            jobTitle,
            companyName,
            runContext
          })
        ]);

        send("status", { message: statusMessages[1] });
        devLog("jd-parsing-summary", parsedJobProfile);

        const mismatchMatrix = buildMismatchMatrix(structuredResume, parsedJobProfile);
        devLog("mismatch-matrix", mismatchMatrix);
        devLog("fit-score", mismatchMatrix.breakdown);

        const [deepAudit, verificationQuestionResult] = await Promise.all([
          Promise.resolve(
            generateDeepAudit({
              structuredResume,
              jobProfile: {
                ...parsedJobProfile,
                jobTitle,
                companyName
              },
              mismatchMatrix
            })
          ),
          generateVerificationQuestions({
            hardGaps: mismatchMatrix.hardGaps,
            structuredResume,
            jobProfile: parsedJobProfile,
            runContext
          })
        ]);

        send("status", { message: statusMessages[2] });
        await streamMarkdownSection(send, "assessment", deepAudit.markdown.assessmentBody);
        await streamMarkdownSection(send, "interview", deepAudit.markdown.interviewBody);
        await streamMarkdownSection(send, "rewrites", deepAudit.markdown.rewriteBody);

        const runSummary = summarizeRun({
          resumeText: ingestion.extractedText,
          jobDescription: normalizedJobDescription,
          mismatchMatrix,
          verificationLogs: [],
          runContext
        });

        const review = buildTransientReview({
          ingestion,
          structuredResume,
          parsedJobProfile,
          mismatchMatrix,
          deepAudit,
          verificationQuestionResult,
          jobTitle,
          companyName,
          normalizedJobDescription,
          runSummary
        });

        send("result", { review });
      } catch (error) {
        send("error", {
          message:
            error?.message || "Even I need a coffee break. The server took too long. Refresh and try again in 5 seconds."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

