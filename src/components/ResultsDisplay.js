"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, CircleDashed, MessageSquareQuote } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getScoreTheme, truncate } from "@/lib/utils";
import { loadTransientReview, saveTransientReview } from "@/lib/transientReview";

function MatrixColumn({ title, items, accent }) {
  const accentMap = {
    green: "text-emerald-700 bg-emerald-50 border-emerald-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    red: "text-red-700 bg-red-50 border-red-200"
  };

  return (
    <div className="glass-card rounded-[2rem] p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-slate">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className={`rounded-3xl border px-4 py-3 text-sm ${accentMap[accent]}`}>
              <div className="font-medium capitalize">{item.value || item}</div>
              {item.evidence ? <div className="mt-1 text-xs opacity-80">{item.evidence}</div> : null}
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-black/10 px-4 py-6 text-sm text-slate">Nothing here yet.</div>
        )}
      </div>
    </div>
  );
}

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
    return <div className="px-4 py-20 text-center text-red-700">{error || "Review not found."}</div>;
  }

  const theme = getScoreTheme(review.fitScore);
  const honestAssessment = review.redFlags?.honestAssessment || "We found both strengths and real gaps in your fit for this role.";

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {signupPrompt ? (
        <div className="mb-6 rounded-[2rem] border border-navy/10 bg-navy px-6 py-5 text-white">
          <div className="text-lg font-semibold">You&apos;ve used your 3 free reviews.</div>
          <div className="mt-2 text-sm text-white/80">
            Create a free Rolemate account to keep going - no payment, ever.
          </div>
          <div className="mt-4">
            <Link href="/register" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy">
              Create free account
            </Link>
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card rounded-[2rem] p-6">
          <div className={`inline-flex rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] ${theme.badge}`}>
            Fit Score
          </div>
          <div className="mt-6 flex items-end gap-4">
            <div className={`bg-gradient-to-r ${theme.ring} bg-clip-text text-7xl font-bold text-transparent`}>
              {review.fitScore}
            </div>
            <div className="max-w-xs text-sm leading-7 text-slate">{theme.label}</div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate">Keyword Match</div>
              <div className="mt-2 text-2xl text-ink">{review.mismatchMatrix.breakdown.keywordMatchPercent}%</div>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate">Relevance</div>
              <div className="mt-2 text-2xl text-ink">{review.mismatchMatrix.breakdown.experienceRelevancePercent}%</div>
            </div>
            <div className="rounded-3xl bg-white p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate">Completeness</div>
              <div className="mt-2 text-2xl text-ink">{review.mismatchMatrix.breakdown.resumeCompletenessPercent}%</div>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] bg-white p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-coral">Resume Read Check</div>
            <p className="mt-3 text-sm leading-7 text-slate">{truncate(review.resume.extractedText, 320)}</p>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-teal">Honesty Layer</div>
          <h1 className="mt-2 text-4xl text-ink">Here&apos;s where you stand</h1>
          <p className="mt-4 text-base leading-8 text-slate">{honestAssessment}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                What&apos;s Working
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate">
                {(review.strengths || []).map((item, index) => (
                  <li key={`strength-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-coral">
                <CircleAlert className="h-4 w-4" />
                What&apos;s Missing
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate">
                {(review.weaknesses || []).map((item, index) => (
                  <li key={`missing-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <MatrixColumn title="Direct Matches" items={review.mismatchMatrix.directMatches} accent="green" />
        <MatrixColumn title="Soft Gaps" items={review.mismatchMatrix.softGaps} accent="amber" />
        <MatrixColumn title="Hard Gaps" items={review.mismatchMatrix.hardGaps} accent="red" />
      </section>

      <section className="mt-6 glass-card rounded-[2rem] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-coral">
              <MessageSquareQuote className="h-4 w-4" />
              Journalistic Verification Agent
            </div>
            <h2 className="mt-2 text-3xl text-ink">Answer these only if they are true</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/app/preview/${review.id}`)}
            className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal"
          >
            Rewrite My Resume for This Role
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {review.verificationLogs.length ? (
            review.verificationLogs.map((log, index) => (
              <div key={log.id} className="rounded-[1.5rem] border border-black/10 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-paper px-3 py-1 text-xs uppercase tracking-[0.14em] text-slate">
                    Gap {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm leading-7 text-ink">{log.question}</div>
                    {log.verified ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified fact saved
                      </div>
                    ) : log.userAnswer ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <CircleDashed className="h-4 w-4" />
                        Answer saved, but not verified as resume-ready
                      </div>
                    ) : null}
                  </div>
                </div>

                <textarea
                  value={answers[log.id] ?? log.userAnswer ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [log.id]: event.target.value }))}
                  className="mt-4 min-h-[110px] w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-4 text-sm leading-7 text-ink outline-none transition focus:border-teal"
                  placeholder="Answer with facts only. If the answer is no, just say no."
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAnswerSubmit(log)}
                    disabled={isPending}
                    className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal disabled:bg-slate"
                  >
                    Save answer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white px-4 py-8 text-center text-sm text-slate">
              No hard gaps were found, so there&apos;s nothing to verify right now.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
