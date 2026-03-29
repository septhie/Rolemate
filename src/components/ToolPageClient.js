"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Upload, FileText, ArrowRight, Sparkles, Coffee } from "lucide-react";
import { saveTransientReview } from "@/lib/transientReview";
import { registerCompletedFreeReview, shouldGateNextReview, unlockFullAccess } from "@/lib/freeCredits";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import MockUnlockOverlay from "@/components/MockUnlockOverlay";
import HonestFriendAvatar from "@/components/HonestFriendAvatar";
import RolemateLogo from "@/components/RolemateLogo";

const progressSteps = [
  "Scanning for corporate buzzwords...",
  "Calculating the odds of being ghosted...",
  "Preparing the harsh truth..."
];

const container = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08
    }
  }
};

export default function ToolPageClient() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState(null);
  const [manualResumeText, setManualResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [progressIndex, setProgressIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [isUnlockProcessing, setIsUnlockProcessing] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState("");
  const [statusMessage, setStatusMessage] = useState(progressSteps[0]);
  const [isTimeoutError, setIsTimeoutError] = useState(false);

  const canSubmit = useMemo(() => {
    const hasResume = Boolean(resumeFile) || manualResumeText.trim().length > 0;
    return hasResume && jobDescription.trim().length >= 100;
  }, [resumeFile, manualResumeText, jobDescription]);

  useEffect(() => {
    if (!isSubmitting) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setProgressIndex((current) => {
        const next = (current + 1) % progressSteps.length;
        setStatusMessage(progressSteps[next]);
        return next;
      });
    }, 2200);

    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  async function readAnalyzeStream(response) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Stream unavailable.");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let finalReview = null;
    let streamError = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const block of events) {
        const lines = block.split("\n");
        const eventLine = lines.find((line) => line.startsWith("event:"));
        const dataLine = lines.find((line) => line.startsWith("data:"));

        if (!eventLine || !dataLine) {
          continue;
        }

        const eventName = eventLine.replace("event:", "").trim();
        const payload = JSON.parse(dataLine.replace("data:", "").trim());

        if (eventName === "status") {
          setStatusMessage(payload.message);
        }

        if (eventName === "feedback") {
          setLiveFeedback((current) => `${current}${payload.chunk}`);
        }

        if (eventName === "result") {
          finalReview = payload.review;
        }

        if (eventName === "error") {
          streamError = payload.message;
        }
      }
    }

    if (streamError) {
      throw new Error(streamError);
    }

    if (!finalReview) {
      throw new Error("Even I need a coffee break. The server took too long—refresh and try again in 5 seconds.");
    }

    return finalReview;
  }

  async function runSubmission() {
    setError("");
    setIsTimeoutError(false);
    setLiveFeedback("");
    setStatusMessage(progressSteps[0]);
    setProgressIndex(0);
    const formData = new FormData();
    if (resumeFile) {
      formData.append("resumePdf", resumeFile);
    }
    formData.append("manualResumeText", manualResumeText);
    formData.append("jobDescription", jobDescription);
    formData.append("jobTitle", jobTitle);
    formData.append("companyName", companyName);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Even I need a coffee break. The server took too long—refresh and try again in 5 seconds.");
      }

      const review = await readAnalyzeStream(response);

      if (review?.transient) {
        saveTransientReview(review);
      }

      registerCompletedFreeReview();
      router.push(`/app/results/${review.id}`);
    } catch (requestError) {
      const message = requestError.message || "Something went wrong while analyzing your resume.";
      const timedOut = /coffee break|too long|timed out|5 seconds/i.test(message);
      setIsTimeoutError(timedOut);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    if (shouldGateNextReview()) {
      setPaywallOpen(true);
      return;
    }

    await runSubmission();
  }

  async function handleMockUnlock() {
    setIsUnlockProcessing(true);
    setUnlockSuccess(false);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    unlockFullAccess();
    setUnlockSuccess(true);
    setToastOpen(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setPaywallOpen(false);
    setIsUnlockProcessing(false);
    await runSubmission();
    window.setTimeout(() => setToastOpen(false), 2400);
  }

  return (
    <>
      <MockUnlockOverlay
        open={paywallOpen}
        isProcessing={isUnlockProcessing}
        isUnlocked={unlockSuccess}
        onContinue={handleMockUnlock}
      />

      <AnimatePresence>
        {toastOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed right-4 top-28 z-[80] rounded-2xl border border-emerald-400/20 bg-emerald-400/12 px-4 py-3 text-sm text-emerald-200 backdrop-blur-2xl"
          >
            Success! Your full Career Roadmap is unlocked.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <motion.div variants={container} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              Honest-first analysis
            </div>
            <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-[-0.07em] text-ink sm:text-6xl">
              Tailor your resume without pretending to be someone else.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate">
              Rolemate finds the real fit, the real gaps, and the real evidence. When something is missing, it interviews you instead of making it up.
            </p>
          </motion.div>

          <motion.div variants={container} className="liquid-panel rounded-[2rem] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300">Review promise</div>
            <div className="mt-4 text-lg leading-8 text-white/82">
              No invented jobs. No invented tools. No fake leadership. Only verified facts, stronger framing, and a clearer shot at the role.
            </div>
          </motion.div>
        </motion.div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-violet-200">Resume Intake</div>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-ink">Upload a PDF resume</h2>

            <label className="relative mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-white/14 bg-white/[0.03] p-8 text-center transition hover:border-white/22 hover:bg-white/[0.05]">
              <div className="absolute inset-y-0 right-4 hidden items-center opacity-[0.08] transition hover:opacity-[0.14] md:flex">
                <RolemateLogo size={180} withWordmark={false} watermark />
              </div>
              <Upload className="h-10 w-10 text-cyan-300" />
              <div className="mt-4 text-lg text-ink">{resumeFile ? resumeFile.name : "Drag in a PDF or click to browse"}</div>
              <div className="mt-2 text-sm text-slate">PDF only, max 5MB</div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </label>

            <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <FileText className="h-4 w-4 text-violet-300" />
                Manual text fallback
              </div>
              <textarea
                value={manualResumeText}
                onChange={(event) => setManualResumeText(event.target.value)}
                className="field-shell mt-3 min-h-[180px] w-full px-4 py-4 text-sm leading-7 outline-none transition"
                placeholder="If your PDF is image-based or unreadable, paste your resume here."
              />
            </div>

            {resumeFile?.size > 5 * 1024 * 1024 ? (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                Your PDF is over the 5MB limit. Please upload a smaller file.
              </div>
            ) : null}
          </div>

          <JobDescriptionInput
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            jobTitle={jobTitle}
            setJobTitle={setJobTitle}
            companyName={companyName}
            setCompanyName={setCompanyName}
          />

          <div className="liquid-panel rounded-[2rem] p-6 lg:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm text-slate">Honest-first analysis only</div>
                <div className="mt-1 text-lg text-ink">
                  Rolemate will never invent skills, jobs, degrees, or certifications.
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate">
                  <Link href="/" className="transition hover:text-white">
                    Home
                  </Link>
                  <Link href="/dashboard" className="transition hover:text-white">
                    Dashboard
                  </Link>
                  <Link href="/login" className="transition hover:text-white">
                    Login
                  </Link>
                </div>
              </div>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting || resumeFile?.size > 5 * 1024 * 1024}
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-white/12 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/55"
              >
                {isSubmitting ? statusMessage : "Analyze honestly"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {isSubmitting ? (
              <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <HonestFriendAvatar />
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-violet-200">Honest Friend live feed</div>
                    <div className="mt-1 text-sm text-white/68">{statusMessage}</div>
                  </div>
                </div>
                <p className="mt-4 min-h-[96px] max-w-3xl text-sm leading-8 text-white/78">
                  {liveFeedback || "Rolemate is reading the room before it says the quiet part out loud."}
                </p>
              </div>
            ) : null}

            {error ? (
              isTimeoutError ? (
                <div className="mt-4 rounded-[1.5rem] border border-amber-400/18 bg-amber-400/10 p-5 text-amber-100">
                  <div className="flex items-center gap-3">
                    <Coffee className="h-5 w-5 text-amber-300" />
                    <div className="text-sm font-semibold uppercase tracking-[0.18em]">Honest Friend</div>
                  </div>
                  <div className="mt-3 text-base leading-8">{error}</div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>
              )
            ) : null}
          </div>
        </form>
      </main>
    </>
  );
}
