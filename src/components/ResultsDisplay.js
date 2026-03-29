"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, CircleDashed, MessageSquareQuote, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getScoreTheme, truncate } from "@/lib/utils";
import { loadTransientReview, saveTransientReview } from "@/lib/transientReview";
import ScoreGauge from "@/components/ScoreGauge";
import HonestFriendAvatar from "@/components/HonestFriendAvatar";

function MatrixColumn({ title, items, accent }) {
  const accentMap = {
    green: "border-emerald-400/12 bg-emerald-400/8 text-emerald-100",
    amber: "border-amber-400/12 bg-amber-400/8 text-amber-100",
    red: "border-red-400/12 bg-red-400/8 text-red-100"
  };

  return (
    <div className="liquid-panel rounded-[1.8rem] p-5">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/36">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className={`rounded-[1.35rem] border px-4 py-3 text-sm ${accentMap[accent]}`}>
              <div className="font-medium text-white">{item.value || item}</div>
              {item.evidence ? <div className="mt-1 text-xs text-white/52">{item.evidence}</div> : null}
            </div>
          ))
        ) : (
          <div className="rounded-[1.35rem] border border-white/8 px-4 py-6 text-sm text-white/48">Nothing here yet.</div>
        )}
      </div>
    </div>
  );
}

const revealList = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.12 }
  }
};

export default function ResultsDisplay({ reviewId, signupPrompt = false }) {
  const router = useRouter();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadReview() {
      const transientReview = loadTransientReview(reviewId);
      if (transientReview) {
        if (active) {
          setReview(transientReview);
          setLoading(false);
        }
        return;
      }

      try {
        const result = await apiFetch(`/api/reviews/${reviewId}`);
        if (active) {
          setReview(result.review);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Could not load this review.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReview();
    return () => {
      active = false;
    };
  }, [reviewId]);

  function handleAnswerSubmit(log) {
    startTransition(async () => {
      try {
        const answer = answers[log.id] ?? log.userAnswer ?? "";
        const result = review.transient
          ? await apiFetch("/api/reviews/verify-transient", {
              method: "POST",
              body: JSON.stringify({
                question: log.question,
                answer,
                verificationLogId: log.id
              })
            })
          : await apiFetch(`/api/reviews/${reviewId}/verification`, {
              method: "POST",
              body: JSON.stringify({
                verificationLogId: log.id,
                answer
              })
            });

        setReview((current) => {
          const nextReview = {
            ...current,
            verificationLogs: current.verificationLogs.map((item) => (item.id === log.id ? result.verificationLog : item))
          };
          if (nextReview.transient) {
            saveTransientReview(nextReview);
          }
          return nextReview;
        });
      } catch (requestError) {
        setError(requestError.message || "Could not save your answer.");
      }
    });
  }

  if (loading) {
    return <div className="px-4 py-20 text-center text-slate">Loading your Rolemate report...</div>;
  }

  if (error || !review) {
    return <div className="px-4 py-20 text-center text-red-300">{error || "Review not found."}</div>;
  }

  const theme = getScoreTheme(review.fitScore);
  const honestAssessment = review.redFlags?.honestAssessment || "We found both strengths and real gaps in your fit for this role.";

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {signupPrompt ? null : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="liquid-panel rounded-[2rem] p-6">
          <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300">ATS Gauge</div>
          <div className="mt-4 flex justify-center">
            <ScoreGauge score={review.fitScore} />
          </div>
          <div className={`mt-5 inline-flex rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.22em] ${theme.badge}`}>
            {theme.label}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="liquid-subtle rounded-[1.35rem] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">Keyword Match</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{review.mismatchMatrix.breakdown.keywordMatchPercent}%</div>
            </div>
            <div className="liquid-subtle rounded-[1.35rem] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">Relevance</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{review.mismatchMatrix.breakdown.experienceRelevancePercent}%</div>
            </div>
            <div className="liquid-subtle rounded-[1.35rem] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">Completeness</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{review.mismatchMatrix.breakdown.resumeCompletenessPercent}%</div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">Resume Read Check</div>
            <p className="mt-3 text-sm leading-7 text-white/60">{truncate(review.resume.extractedText, 320)}</p>
          </div>
        </div>

        <div className="liquid-panel rounded-[2rem] p-6">
          <div className="flex items-center gap-4">
            <HonestFriendAvatar />
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-violet-200">Honest Friend</div>
              <h1 className="mt-1 text-4xl font-bold tracking-[-0.06em] text-white">Here&apos;s where you stand</h1>
            </div>
          </div>

          <motion.div
            variants={revealList}
            initial="hidden"
            animate="show"
            className="mt-6 grid gap-4"
          >
            <motion.div variants={revealList} className="rounded-[1.6rem] border border-emerald-400/12 bg-emerald-400/8 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Pros
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
                {(review.strengths || []).map((item, index) => (
                  <li key={`strength-${index}`}>{item}</li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={revealList} className="rounded-[1.6rem] border border-amber-400/12 bg-amber-400/8 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <CircleAlert className="h-4 w-4" />
                Cons
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
                {(review.weaknesses || []).map((item, index) => (
                  <li key={`missing-${index}`}>{item}</li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={revealList} className="rounded-[1.6rem] border border-white/8 bg-[#071018] p-5">
              <div className="text-sm font-semibold text-violet-200">Harsh Truth</div>
              <p className="mt-3 text-base leading-8 text-white/84">{honestAssessment}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <MatrixColumn title="Direct Matches" items={review.mismatchMatrix.directMatches} accent="green" />
        <MatrixColumn title="Soft Gaps" items={review.mismatchMatrix.softGaps} accent="amber" />
        <MatrixColumn title="Hard Gaps" items={review.mismatchMatrix.hardGaps} accent="red" />
      </section>

      <section className="mt-6 liquid-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-violet-200">
              <MessageSquareQuote className="h-4 w-4" />
              Journalistic Verification Agent
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white">Only answer if it&apos;s true</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/app/preview/${review.id}`)}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
          >
            Rewrite My Resume
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {review.verificationLogs.length ? (
            review.verificationLogs.map((log, index) => (
              <div key={log.id} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/44">
                    Gap {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm leading-7 text-white/86">{log.question}</div>
                    {log.verified ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified fact saved
                      </div>
                    ) : log.userAnswer ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                        <CircleDashed className="h-4 w-4" />
                        Answer saved, but not verified as resume-ready
                      </div>
                    ) : null}
                  </div>
                </div>

                <textarea
                  value={answers[log.id] ?? log.userAnswer ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [log.id]: event.target.value }))}
                  className="field-shell mt-4 min-h-[110px] w-full px-4 py-4 text-sm leading-7 outline-none transition"
                  placeholder="Answer with facts only. If the answer is no, just say no."
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAnswerSubmit(log)}
                    disabled={isPending}
                    className="rounded-full border border-white/12 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:bg-white/20 disabled:text-white/45"
                  >
                    Save answer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/48">
              No hard gaps were found, so there&apos;s nothing to verify right now.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
