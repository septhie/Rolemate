"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDashed, MessageSquareQuote, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getScoreTheme, truncate } from "@/lib/utils";
import { loadTransientReview, saveTransientReview } from "@/lib/transientReview";
import ScoreGauge from "@/components/ScoreGauge";
import HonestFriendAvatar from "@/components/HonestFriendAvatar";

function AuditSkillCard({ item }) {
  const tone =
    item.status === "direct"
      ? "border-emerald-500/18 bg-emerald-500/8"
      : item.status === "transferable"
        ? "border-amber-400/20 bg-amber-400/8"
        : "border-red-400/18 bg-red-500/8";

  return (
    <div className={`rounded-[1.35rem] border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[#111827]">{item.skill}</div>
        <div className="rounded-full border border-black/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#334155]">
          {item.status}
        </div>
      </div>
      <div className="mt-3 text-sm leading-7 text-[#334155]">{item.evidence}</div>
      {item.bridgeRecommendation ? (
        <div className="mt-3 rounded-[1rem] border border-black/6 bg-black/[0.03] p-3 text-sm leading-7 text-[#334155]">
          <strong className="text-[#111827]">Bridge this gap:</strong> {item.bridgeRecommendation}
          {item.bridgeWhy ? <div className="mt-2 text-xs text-[#475569]">{item.bridgeWhy}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function RewriteCard({ item }) {
  return (
    <div className="rounded-[1.35rem] border border-[#d4a85c]/18 bg-[#f5f5f5] p-4">
      <div className="space-y-3 text-sm leading-7 text-[#334155]">
        <div>
          <strong className="text-[#111827]">Original:</strong> {item.original}
        </div>
        <div>
          <strong className="text-[#111827]">Rewrite:</strong> {item.rewrite}
        </div>
        <div>
          <strong className="text-[#111827]">Why this is stronger:</strong> {item.why}
        </div>
      </div>
    </div>
  );
}

function InterviewCard({ question, index }) {
  const label = index < 2 ? "Pressure Question" : "Experience Question";

  return (
    <div className="rounded-[1.5rem] border border-[#d4a85c]/18 bg-[#f5f5f5] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[#b3872f]">{label}</div>
      <div className="mt-3 text-base leading-8 text-[#111827]">{question}</div>
    </div>
  );
}

function MatrixColumn({ title, items, accent }) {
  const accentMap = {
    green: "border-[#d4a85c]/18 bg-[#f5f5f5] text-[#111827]",
    amber: "border-[#d4a85c]/18 bg-[#f5f5f5] text-[#111827]",
    red: "border-[#d4a85c]/18 bg-[#f5f5f5] text-[#111827]"
  };

  return (
    <div className="liquid-panel rounded-[1.8rem] p-5">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/36">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className={`rounded-[1.35rem] border px-4 py-3 text-sm ${accentMap[accent]}`}>
              <div className="font-medium text-[#111827]">{item.value || item}</div>
              {item.evidence ? <div className="mt-1 text-xs text-[#475569]">{item.evidence}</div> : null}
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
  const audit = review.audit || { skillAudit: [], interviewQuestions: [], bulletRewrites: [] };

  return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {signupPrompt ? null : null}

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">Audit Overview</div>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.06em] text-white">In-Depth Auditor</h1>
                <div className={`mt-4 inline-flex rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.22em] ${theme.badge}`}>
                  {theme.label}
                </div>
              </div>
              <ScoreGauge score={review.fitScore} />
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
              <div className="flex items-center gap-4">
                <HonestFriendAvatar />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">No-BS Auditor</div>
                  <div className="mt-2 text-base leading-8 text-white/86 whitespace-pre-line">{honestAssessment}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">Evidence By Requirement</div>
            <div className="mt-5 grid gap-4">
              {(audit.skillAudit || []).length ? (
                audit.skillAudit.map((item) => <AuditSkillCard key={item.skill} item={item} />)
              ) : (
                <div className="rounded-[1.35rem] border border-white/8 px-4 py-6 text-sm text-white/48">No skill audit was generated.</div>
              )}
            </div>
          </div>

          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">Direct Fix Recommendations</div>
            <div className="mt-5 grid gap-4">
              {(audit.bulletRewrites || []).length ? (
                audit.bulletRewrites.map((item, index) => <RewriteCard key={`rewrite-${index}`} item={item} />)
              ) : (
                <div className="rounded-[1.35rem] border border-white/8 px-4 py-6 text-sm text-white/48">Not enough resume detail was available to rewrite bullets yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">Interview Prep</div>
            <div className="mt-4 text-sm leading-7 text-white/60">These are written for this exact resume and this exact job, not generic prep questions.</div>
            <motion.div variants={revealList} initial="hidden" animate="show" className="mt-5 grid gap-4">
              {(audit.interviewQuestions || []).length ? (
                audit.interviewQuestions.map((question, index) => (
                  <motion.div variants={revealList} key={`question-${index}`}>
                    <InterviewCard question={question} index={index} />
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-white/8 px-4 py-6 text-sm text-white/48">Interview questions will appear here once the audit has enough signal.</div>
              )}
            </motion.div>
          </div>

          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">What&apos;s Working</div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/76">
              {(review.strengths || []).map((item, index) => (
                <li key={`strength-${index}`} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                  <strong className="text-white">-</strong> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">What&apos;s Missing</div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/76">
              {(review.weaknesses || []).map((item, index) => (
                <li key={`missing-${index}`} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                  <strong className="text-white">-</strong> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">Resume Read Check</div>
            <p className="mt-3 text-sm leading-7 text-white/60">{truncate(review.resume.extractedText, 320)}</p>
          </div>
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
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#efcf94]">
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
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#d4a85c]/12 px-3 py-2 text-xs text-[#efcf94]">
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
