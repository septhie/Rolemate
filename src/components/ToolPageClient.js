"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Coffee, FileText, Sparkles, Upload } from "lucide-react";
import { saveTransientReview } from "@/lib/transientReview";
import { registerCompletedFreeReview, shouldGateNextReview, unlockFullAccess } from "@/lib/freeCredits";
import HonestFriendAvatar from "@/components/HonestFriendAvatar";
import RolemateLogo from "@/components/RolemateLogo";
import ScoreGauge from "@/components/ScoreGauge";

const progressSteps = [
  "Scanning for BS...",
  "Checking if you actually know Python...",
  "Preparing the harsh truth..."
];

const floatingChips = [
  { label: "ATS Scan", className: "left-[56%] top-[18%]" },
  { label: "Tone Check", className: "right-[20%] top-[12%]" },
  { label: "Red Flags", className: "right-[8%] top-[34%]" }
];

function DrawerResult({ review }) {
  if (!review) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-7 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.26em] text-[#efcf94]">Honest Friend</div>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white">The truth about your fit</h2>
        </div>
        <div className="shrink-0">
          <ScoreGauge score={review.fitScore} />
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-[28px] border border-[#d4a85c]/14 bg-[#f5f5f5] p-5 text-[#111827]">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#8b6a31]">Harsh Truth</div>
          <p className="mt-3 text-base leading-8">
            {review.redFlags?.honestAssessment || "Rolemate found both real strengths and real gaps in your fit."}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">What&apos;s Working</div>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-white/78">
              {(review.strengths || []).slice(0, 4).map((item, index) => (
                <li key={`strength-${index}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">What&apos;s Missing</div>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-white/78">
              {(review.weaknesses || []).slice(0, 4).map((item, index) => (
                <li key={`weakness-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/38">Mismatch Matrix</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">Direct</div>
              <div className="mt-2 text-3xl font-semibold text-white">{review.mismatchMatrix.directMatches.length}</div>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">Soft Gaps</div>
              <div className="mt-2 text-3xl font-semibold text-white">{review.mismatchMatrix.softGaps.length}</div>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/34">Hard Gaps</div>
              <div className="mt-2 text-3xl font-semibold text-white">{review.mismatchMatrix.hardGaps.length}</div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-3 pt-2">
          <Link href={`/app/results/${review.id}`} className="rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-black">
            Open Full Report
          </Link>
          <Link href={`/app/preview/${review.id}`} className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white">
            Rewrite Resume
          </Link>
        </div>
      </div>
    </div>
  );
}

function MemberEntryInvite({ isProcessing, isUnlocked, onContinue }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
      <div className="absolute inset-0 rounded-[34px] bg-[#0d1117]/50 backdrop-blur-xl" />
      <div className="liquid-panel relative z-10 w-full max-w-xl rounded-[30px] p-8">
        <div className="text-[11px] uppercase tracking-[0.26em] text-[#efcf94]">Member Entry</div>
        <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">You&apos;re on a roll.</h3>
        <p className="mt-4 text-base leading-8 text-white/70">
          Sign in with Google to save your history, track your ATS score over time, and keep your Honest Friend in your corner.
        </p>
        <button
          type="button"
          onClick={onContinue}
          disabled={isProcessing || isUnlocked}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/12 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:opacity-70"
        >
          {isProcessing ? "Processing..." : isUnlocked ? "Success!" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

export default function ToolPageClient() {
  const [resumeFile, setResumeFile] = useState(null);
  const [manualResumeText, setManualResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState("");
  const [statusMessage, setStatusMessage] = useState(progressSteps[0]);
  const [currentReview, setCurrentReview] = useState(null);
  const [drawerState, setDrawerState] = useState("closed");
  const [drawerInvite, setDrawerInvite] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [isUnlockProcessing, setIsUnlockProcessing] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  const canSubmit = useMemo(() => {
    const hasResume = Boolean(resumeFile) || manualResumeText.trim().length > 0;
    return hasResume && jobDescription.trim().length >= 100;
  }, [resumeFile, manualResumeText, jobDescription]);

  useEffect(() => {
    if (!isSubmitting) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setStatusMessage((current) => {
        const currentIndex = progressSteps.indexOf(current);
        return progressSteps[(currentIndex + 1) % progressSteps.length];
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
        } else if (eventName === "feedback") {
          setLiveFeedback((current) => `${current}${payload.chunk}`);
        } else if (eventName === "result") {
          finalReview = payload.review;
        } else if (eventName === "error") {
          streamError = payload.message;
        }
      }
    }

    if (streamError) {
      throw new Error(streamError);
    }

    if (!finalReview) {
      throw new Error("Even I need a coffee break. The server took too long. Refresh and try again in 5 seconds.");
    }

    return finalReview;
  }

  async function runSubmission() {
    setError("");
    setLiveFeedback("");
    setStatusMessage(progressSteps[0]);
    setIsSubmitting(true);
    setDrawerState("loading");
    setDrawerInvite(false);

    const formData = new FormData();
    if (resumeFile) {
      formData.append("resumePdf", resumeFile);
    }
    formData.append("manualResumeText", manualResumeText);
    formData.append("jobDescription", jobDescription);
    formData.append("jobTitle", jobTitle);
    formData.append("companyName", companyName);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Even I need a coffee break. The server took too long. Refresh and try again in 5 seconds.");
      }

      const review = await readAnalyzeStream(response);
      if (review?.transient) {
        saveTransientReview(review);
      }

      registerCompletedFreeReview();
      setCurrentReview(review);
      setDrawerState("result");
    } catch (requestError) {
      setError(requestError.message || "Something went wrong while analyzing your resume.");
      setDrawerState("loading");
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
      setDrawerState("result");
      setDrawerInvite(true);
      return;
    }

    await runSubmission();
  }

  async function handleMemberEntry() {
    setIsUnlockProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    unlockFullAccess();
    setUnlockSuccess(true);
    setToastOpen(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setDrawerInvite(false);
    setIsUnlockProcessing(false);
    window.setTimeout(() => setToastOpen(false), 2200);
    await runSubmission();
  }

  const workspaceShifted = drawerState !== "closed";

  return (
    <>
      <AnimatePresence>
        {toastOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed right-10 top-10 z-50 rounded-2xl border border-[#d4a85c]/25 bg-[#d4a85c]/12 px-4 py-3 text-sm text-[#efcf94] backdrop-blur-xl"
          >
            Success! Your progress is ready to save.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="relative min-h-screen overflow-hidden pr-5">
        <div className="relative h-screen">
          <motion.div
            animate={{
              x: workspaceShifted ? -120 : 0,
              y: workspaceShifted ? -12 : 0,
              scale: workspaceShifted ? 0.62 : 1
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute bottom-10 left-6 z-10 max-w-[560px] lg:left-10"
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#efcf94]">Studio Canvas</div>
            <h1 className="font-display mt-4 text-6xl leading-[0.92] tracking-[-0.06em] text-white sm:text-7xl lg:text-[6.6rem]">
              The Truth About Your Career.
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-white/58">
              Bring the resume. Bring the role. Rolemate handles the blunt feedback, the real gaps, and the stronger case for what you actually deserve.
            </p>
          </motion.div>

          <div className="absolute inset-0">
            {floatingChips.map((chip) => (
              <motion.div
                key={chip.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`absolute ${chip.className} rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/66 shadow-[0_18px_50px_rgba(0,0,0,0.18)]`}
              >
                {chip.label}
              </motion.div>
            ))}
          </div>

          <motion.form
            onSubmit={handleSubmit}
            animate={{
              x: workspaceShifted ? -90 : 0,
              scale: workspaceShifted ? 0.92 : 1
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-[10%] top-1/2 z-10 w-[min(42vw,640px)] -translate-y-1/2"
          >
            <div className="liquid-panel rounded-[42%_58%_46%_54%/20%_28%_72%_80%] px-10 py-12">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">Engine</div>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">Resume upload studio</h2>
                </div>
                <div className="opacity-[0.08]">
                  <RolemateLogo size={120} withWordmark={false} watermark />
                </div>
              </div>

              <label className="mt-8 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[32px] border border-dashed border-white/14 bg-white/[0.03] text-center transition hover:border-white/24">
                <Upload className="h-10 w-10 text-[#efcf94]" />
                <div className="mt-4 text-lg text-white">{resumeFile ? resumeFile.name : "Drop a PDF or click to upload"}</div>
                <div className="mt-2 text-sm text-white/48">PDF only. Max 5MB.</div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                />
              </label>

              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    className="field-shell px-4 py-3 outline-none"
                    placeholder="Job Title"
                  />
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="field-shell px-4 py-3 outline-none"
                    placeholder="Company"
                  />
                </div>

                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  className="field-shell min-h-[180px] w-full px-4 py-4 text-sm leading-7 outline-none"
                  placeholder="Paste the full job description here."
                />

                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <FileText className="h-4 w-4 text-[#efcf94]" />
                    Manual fallback
                  </div>
                  <textarea
                    value={manualResumeText}
                    onChange={(event) => setManualResumeText(event.target.value)}
                    className="field-shell mt-3 min-h-[120px] w-full px-4 py-4 text-sm leading-7 outline-none"
                    placeholder="If extraction struggles, paste your resume text here."
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="text-sm text-white/48">3 free reviews before member entry.</div>
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || resumeFile?.size > 5 * 1024 * 1024}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/45"
                >
                  {isSubmitting ? statusMessage : "Start analysis"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-[24px] border border-[#d4a85c]/18 bg-[#d4a85c]/10 p-4 text-sm text-[#efcf94]">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  {error}
                </div>
              </div>
            ) : null}
          </motion.form>

          <AnimatePresence>
            {drawerState !== "closed" ? (
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-5 right-5 top-5 z-20 w-[min(50vw,760px)] rounded-[34px] border border-white/8 bg-[#0d1117]/72 backdrop-blur-2xl"
              >
                {drawerInvite ? <div className="absolute inset-0 rounded-[34px] bg-[#0d1117]/45 backdrop-blur-md" /> : null}

                {drawerState === "loading" ? (
                  <div className="flex h-full flex-col px-7 py-8">
                    <div className="flex items-center gap-3">
                      <HonestFriendAvatar />
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.26em] text-[#efcf94]">Honest Friend live feed</div>
                        <div className="mt-1 text-sm text-white/58">{statusMessage}</div>
                      </div>
                    </div>

                    <div className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                      <p className="min-h-[240px] text-base leading-9 text-white/80">
                        {liveFeedback || "Rolemate is reading the room before it says the quiet part out loud."}
                      </p>
                    </div>
                  </div>
                ) : null}

                {drawerState === "result" ? <DrawerResult review={currentReview} /> : null}

                {drawerInvite ? (
                  <MemberEntryInvite
                    isProcessing={isUnlockProcessing}
                    isUnlocked={unlockSuccess}
                    onContinue={handleMemberEntry}
                  />
                ) : null}
              </motion.aside>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
