"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Coffee, FileText, Grip, Sparkles, Upload } from "lucide-react";
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
  { label: "ATS Scan", className: "left-[4%] top-[8%]" },
  { label: "Tone Check", className: "right-[12%] top-[6%]" },
  { label: "Red Flags", className: "right-[4%] top-[20%]" }
];

function OrganicUploadPanel({
  resumeFile,
  setResumeFile,
  jobTitle,
  setJobTitle,
  companyName,
  setCompanyName,
  jobDescription,
  setJobDescription,
  manualResumeText,
  setManualResumeText,
  canSubmit,
  isSubmitting,
  statusMessage
}) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="glass-panel relative overflow-hidden rounded-[2.8rem] px-[3.2vw] py-[4vh]">
        <div className="pointer-events-none absolute -right-[5vw] top-[2vh] opacity-[0.06]">
          <RolemateLogo size={140} withWordmark={false} watermark />
        </div>

        <div className="relative">
          <div className="text-[0.68rem] uppercase tracking-[0.32em] text-[#ffcf57]">Upload Engine</div>
          <div className="mt-[1.8vh] max-w-[28rem] text-[0.92rem] leading-7 text-white/54">
            Drop the resume, paste the role, and let Rolemate turn the right side of the canvas into an honest live feed.
          </div>

          <label className="mt-[3vh] flex aspect-video cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/12 bg-white/[0.03] text-center transition hover:border-white/22">
            <Upload className="h-10 w-10 text-[#ffcf57]" />
            <div className="mt-4 text-[1.08rem] text-white">{resumeFile ? resumeFile.name : "Drop a PDF or tap to upload"}</div>
            <div className="mt-2 text-[0.78rem] uppercase tracking-[0.22em] text-white/36">PDF only | 5MB max</div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
            />
          </label>

          <div className="mt-[3vh] grid gap-[1.6vh]">
            <div className="grid gap-[1.6vh] xl:grid-cols-2">
              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                className="field-shell rounded-[1.6rem] px-5 py-4"
                placeholder="Target role"
              />
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="field-shell rounded-[1.6rem] px-5 py-4"
                placeholder="Company"
              />
            </div>

            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="field-shell min-h-[22vh] rounded-[1.7rem] px-5 py-5 text-[0.92rem] leading-8"
              placeholder="Paste the full job description here."
            />

            <div className="glass-panel rounded-[1.7rem] p-4">
              <div className="flex items-center gap-3 text-[0.76rem] uppercase tracking-[0.22em] text-white/42">
                <FileText className="h-4 w-4 text-[#ffcf57]" />
                Resume fallback
              </div>
              <textarea
                value={manualResumeText}
                onChange={(event) => setManualResumeText(event.target.value)}
                className="field-shell mt-3 min-h-[14vh] rounded-[1.4rem] px-5 py-5 text-[0.88rem] leading-8"
                placeholder="If extraction misses anything, paste your resume text here."
              />
            </div>
          </div>

          <div className="mt-[3vh] flex flex-wrap items-center justify-between gap-4">
            <div className="text-[0.72rem] uppercase tracking-[0.2em] text-white/34">3 free reviews with zero login friction</div>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting || resumeFile?.size > 5 * 1024 * 1024}
              className="status-glow inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#ffb800] px-6 py-3 text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35"
            >
              {isSubmitting ? statusMessage : "Run Honest Scan"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function LoadingCards({ statusMessage, liveFeedback }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-[56vh]"
    >
      <motion.div className="glass-panel-strong absolute right-0 top-0 w-[88%] rounded-[2.3rem] p-[2.4rem]">
        <div className="flex items-center gap-4">
          <HonestFriendAvatar />
          <div>
            <div className="text-[0.66rem] uppercase tracking-[0.28em] text-[#ffcf57]">Honest Friend live</div>
            <div className="mt-2 text-[0.82rem] uppercase tracking-[0.18em] text-white/42">{statusMessage}</div>
          </div>
        </div>
        <div className="analysis-text mt-[3.2vh] min-h-[26vh] text-[0.95rem] leading-8 text-[#f5f5f5]">
          {liveFeedback || "Rolemate is reading the role, checking your claims, and deciding how blunt it needs to be."}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08, duration: 0.5 }}
        className="glass-panel absolute bottom-[10%] left-[6%] w-[52%] rounded-[2rem] p-5"
      >
        <div className="text-[0.66rem] uppercase tracking-[0.28em] text-white/34">Live filter</div>
        <div className="analysis-text mt-4 text-[0.82rem] leading-7 text-white/66">
          Streaming in real time so the session never idles out while the Honest Friend builds the case.
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultCards({ review }) {
  if (!review) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 90 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-[70vh]"
    >
      <motion.article
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.04, duration: 0.5 }}
        className="glass-panel-strong absolute right-0 top-0 z-20 w-[86%] rounded-[2.4rem] p-[2.6rem]"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-[0.66rem] uppercase tracking-[0.28em] text-[#ffcf57]">Harsh Truth</div>
            <p className="analysis-text mt-5 max-w-[36rem] text-[0.94rem] leading-8 text-[#f5f5f5]">
              {review.redFlags?.honestAssessment || "Rolemate found both strengths and real friction in your fit."}
            </p>
          </div>
          <div className="shrink-0 scale-[0.78] origin-top-right">
            <ScoreGauge score={review.fitScore} />
          </div>
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12, duration: 0.5 }}
        className="glass-panel absolute left-[2%] top-[34%] z-10 w-[54%] rounded-[2.1rem] p-6"
      >
        <div className="text-[0.66rem] uppercase tracking-[0.28em] text-[#ffcf57]">What&apos;s Working</div>
        <ul className="analysis-text mt-4 space-y-3 text-[0.82rem] leading-7 text-white/76">
          {(review.strengths || []).slice(0, 4).map((item, index) => (
            <li key={`strength-${index}`}>{item}</li>
          ))}
        </ul>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, x: 70 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18, duration: 0.5 }}
        className="glass-panel absolute bottom-0 right-[4%] z-30 w-[62%] rounded-[2rem] p-6"
      >
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-[0.66rem] uppercase tracking-[0.28em] text-white/34">Missing / Gaps</div>
            <ul className="analysis-text mt-4 space-y-3 text-[0.82rem] leading-7 text-white/72">
              {(review.weaknesses || []).slice(0, 4).map((item, index) => (
                <li key={`weakness-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-3 py-4 text-center">
                <div className="text-[0.62rem] uppercase tracking-[0.16em] text-white/34">Direct</div>
                <div className="mt-2 text-2xl text-white">{review.mismatchMatrix.directMatches.length}</div>
              </div>
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-3 py-4 text-center">
                <div className="text-[0.62rem] uppercase tracking-[0.16em] text-white/34">Soft</div>
                <div className="mt-2 text-2xl text-white">{review.mismatchMatrix.softGaps.length}</div>
              </div>
              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-3 py-4 text-center">
                <div className="text-[0.62rem] uppercase tracking-[0.16em] text-white/34">Hard</div>
                <div className="mt-2 text-2xl text-white">{review.mismatchMatrix.hardGaps.length}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/app/results/${review.id}`}
                className="inline-flex rounded-full border border-white/10 bg-[#ffb800] px-4 py-3 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-black"
              >
                Full report
              </Link>
              <Link
                href={`/app/preview/${review.id}`}
                className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-white"
              >
                Rewrite
              </Link>
            </div>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

function MemberEntryInvite({ isProcessing, isUnlocked, onContinue }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-[4vw]">
      <div className="glass-panel-strong w-full max-w-[34rem] rounded-[2.2rem] p-8">
        <div className="text-[0.66rem] uppercase tracking-[0.28em] text-[#ffcf57]">Member Entry</div>
        <h3 className="font-display mt-4 text-[2.4rem] leading-none tracking-[-0.05em] text-[#f5f5f5]">
          Save your progress.
        </h3>
        <p className="analysis-text mt-5 text-[0.86rem] leading-8 text-white/68">
          You&apos;re on a roll. Sign in with Google to save your history, track your ATS score over time, and keep your Honest Friend in your corner.
        </p>
        <button
          type="button"
          onClick={onContinue}
          disabled={isProcessing || isUnlocked}
          className="status-glow mt-7 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-[#ffb800] px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-black transition hover:scale-[1.01] disabled:opacity-70"
        >
          {isProcessing ? "Processing..." : isUnlocked ? "Success!" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

function ErrorCard({ error }) {
  if (!error) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel mt-[2vh] rounded-[1.8rem] border-[#ffb800]/20 bg-[#ffb800]/8 p-5"
    >
      <div className="flex items-start gap-3">
        <Coffee className="mt-1 h-4 w-4 text-[#ffcf57]" />
        <p className="analysis-text text-[0.82rem] leading-7 text-[#f5f5f5]">{error}</p>
      </div>
    </motion.div>
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
  const [resultsState, setResultsState] = useState("idle");
  const [showInvite, setShowInvite] = useState(false);
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
    setResultsState("loading");
    setShowInvite(false);

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
      setResultsState("result");
    } catch (requestError) {
      setError(requestError.message || "Something went wrong while analyzing your resume.");
      setResultsState("idle");
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
      setShowInvite(true);
      setResultsState("idle");
      return;
    }

    await runSubmission();
  }

  async function handleMemberEntry() {
    setIsUnlockProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    unlockFullAccess();
    setUnlockSuccess(true);
    setToastOpen(true);
    setShowInvite(false);
    setIsUnlockProcessing(false);
    window.setTimeout(() => setToastOpen(false), 2400);
    await runSubmission();
  }

  const rightColumnBlurred = showInvite;

  return (
    <>
      <AnimatePresence>
        {toastOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed right-[3vw] top-[3vh] z-50 rounded-[1.4rem] border border-[#ffb800]/24 bg-[#ffb800]/10 px-4 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-[#ffcf57] backdrop-blur-2xl"
          >
            Success! Progress unlocked.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="min-h-screen w-full">
        <section className="grid min-h-screen w-full grid-cols-1 pb-[5.5vh] pl-20 lg:grid-cols-[minmax(24rem,38vw)_minmax(0,1fr)] xl:grid-cols-[minmax(28rem,40vw)_minmax(0,1fr)]">
          <div className="relative min-h-[44vh] border-b border-white/8 lg:min-h-screen lg:border-b-0">
            <div className="flex h-full min-h-[44vh] items-end px-[4vw] pb-[8vh] pt-[12vh] lg:sticky lg:top-0 lg:min-h-[calc(100vh-5.5vh)] xl:px-[5vw] xl:pb-[10vh]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-[32rem]"
              >
                <div className="text-[0.72rem] uppercase tracking-[0.34em] text-[#ffcf57]">Rolemate Canvas</div>
                <h1 className="font-display mt-[2.6vh] text-[clamp(3.2rem,5.6vw,6.8rem)] leading-[0.92] tracking-[-0.07em] text-[#f5f5f5]">
                  The Truth About Your Career.
                </h1>
                <p className="analysis-text mt-[2.4vh] max-w-[24rem] text-[0.9rem] leading-8 text-white/56">
                  Honest-first resume reviews for students who need signal, not fluff. Upload on the right. Watch the truth stream in live.
                </p>
              </motion.div>
            </div>
          </div>

          <div className="relative min-h-[56vh] overflow-hidden">
            <div className={`relative h-full min-h-[calc(100vh-5.5vh)] overflow-y-auto px-[3vw] py-[6vh] transition duration-300 ${rightColumnBlurred ? "blur-xl" : ""}`}>
              <div className="relative flex w-full flex-col gap-[2.6vh]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[28vh]">
                  {floatingChips.map((chip, index) => (
                    <motion.div
                      key={chip.label}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * index, duration: 0.45 }}
                      className={`absolute ${chip.className} inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[0.62rem] uppercase tracking-[0.24em] text-white/60 shadow-[0_18px_40px_rgba(0,0,0,0.26)]`}
                    >
                      <Grip className="h-3.5 w-3.5 text-[#ffcf57]" />
                      {chip.label}
                    </motion.div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-[2.4vh]">
                  <OrganicUploadPanel
                    resumeFile={resumeFile}
                    setResumeFile={setResumeFile}
                    jobTitle={jobTitle}
                    setJobTitle={setJobTitle}
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    jobDescription={jobDescription}
                    setJobDescription={setJobDescription}
                    manualResumeText={manualResumeText}
                    setManualResumeText={setManualResumeText}
                    canSubmit={canSubmit}
                    isSubmitting={isSubmitting}
                    statusMessage={statusMessage}
                  />

                  <div className="grid gap-[2vh] lg:grid-cols-[0.72fr_0.28fr]">
                    <div className="glass-panel rounded-[2rem] p-6">
                      <div className="flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.28em] text-[#ffcf57]">
                        <Sparkles className="h-4 w-4" />
                        What Rolemate checks
                      </div>
                      <div className="analysis-text mt-4 grid gap-3 text-[0.82rem] leading-7 text-white/66 sm:grid-cols-3">
                        <div>Keyword truth versus the JD</div>
                        <div>Real transferable skills hiding in plain sight</div>
                        <div>Harsh gaps the resume still cannot cover</div>
                      </div>
                    </div>

                    <div className="glass-panel rounded-[2rem] p-6">
                      <div className="text-[0.66rem] uppercase tracking-[0.28em] text-white/34">Guest mode</div>
                      <div className="analysis-text mt-4 text-[0.82rem] leading-7 text-white/62">
                        Three full reviews free. The fourth asks you to save your progress.
                      </div>
                    </div>
                  </div>
                </form>

                <ErrorCard error={error} />

                <div className="relative min-h-[24vh]">
                  <AnimatePresence mode="wait">
                    {resultsState === "loading" ? <LoadingCards key="loading" statusMessage={statusMessage} liveFeedback={liveFeedback} /> : null}
                    {resultsState === "result" ? <ResultCards key="result" review={currentReview} /> : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showInvite ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-black/24"
                >
                  <MemberEntryInvite
                    isProcessing={isUnlockProcessing}
                    isUnlocked={unlockSuccess}
                    onContinue={handleMemberEntry}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </>
  );
}
