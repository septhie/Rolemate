"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Download, Copy, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ResumeRenderer from "@/components/ResumeRenderer";
import {
  loadTransientReview,
  loadTransientRewrite,
  saveTransientReview,
  saveTransientRewrite
} from "@/lib/transientReview";

const modes = ["Strict", "Suggestion", "Translation"];

function resumeJsonToText(improvedJson) {
  if (!improvedJson) {
    return "";
  }

  const parts = [improvedJson.contactName, improvedJson.contactLine, improvedJson.summary];

  (improvedJson.sections || []).forEach((section) => {
    parts.push(`\n${section.title.toUpperCase()}`);
    if (section.type === "skill-list") {
      parts.push((section.items || []).join(" | "));
      return;
    }

    (section.items || []).forEach((item) => {
      parts.push([item.title, item.subtitle, item.dates].filter(Boolean).join(" | "));
      (item.bullets || []).forEach((bullet) => {
        parts.push(`- ${bullet.text || bullet}`);
      });
    });
  });

  return parts.filter(Boolean).join("\n");
}

export default function PreviewView({ reviewId, initialMode = "Strict" }) {
  const [review, setReview] = useState(null);
  const [mode, setMode] = useState(initialMode);
  const [improvedResume, setImprovedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isPending, startTransition] = useTransition();
  const previewRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadReview() {
      const transientReview = loadTransientReview(reviewId);
      if (transientReview) {
        if (!active) {
          return;
        }

        setReview(transientReview);
        const existingTransientRewrite = loadTransientRewrite(reviewId, initialMode) || transientReview.improvedResumes?.find((item) => item.mode === initialMode) || null;
        setImprovedResume(existingTransientRewrite);
        setLoading(false);
        return;
      }

      try {
        const result = await apiFetch(`/api/reviews/${reviewId}`);
        if (!active) {
          return;
        }

        setReview(result.review);
        const existing = (result.review.improvedResumes || []).find((item) => item.mode === initialMode) || result.review.improvedResumes?.[0] || null;
        setImprovedResume(existing);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Could not load the preview.");
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
  }, [initialMode, reviewId]);

  useEffect(() => {
    if (!review) {
      return;
    }

    const existing = loadTransientRewrite(reviewId, mode) || (review.improvedResumes || []).find((item) => item.mode === mode);
    if (existing) {
      setImprovedResume(existing);
      return;
    }

    startTransition(async () => {
      try {
        const result = review.transient
          ? await apiFetch("/api/reviews/rewrite-transient", {
              method: "POST",
              body: JSON.stringify({ mode, review })
            })
          : await apiFetch(`/api/reviews/${reviewId}/rewrite`, {
              method: "POST",
              body: JSON.stringify({ mode })
            });

        setImprovedResume(result.improvedResume);
        if (review.transient) {
          saveTransientRewrite(reviewId, mode, result.improvedResume);
          setReview((current) => {
            const nextReview = {
              ...current,
              improvedResumes: [result.improvedResume, ...(current.improvedResumes || []).filter((item) => item.mode !== result.improvedResume.mode)]
            };
            saveTransientReview(nextReview);
            return nextReview;
          });
        } else {
          setReview((current) => ({
            ...current,
            improvedResumes: [result.improvedResume, ...(current.improvedResumes || [])]
          }));
        }
      } catch (requestError) {
        setError(requestError.message || "Could not generate the rewrite.");
      }
    });
  }, [mode, review, reviewId]);

  const pendingSuggestions = useMemo(
    () => improvedResume?.improvedJson?.suggestedBullets?.filter((item) => item.status === "pending") || [],
    [improvedResume]
  );

  async function handleSuggestionDecision(suggestionId, decision) {
    try {
      if (review.transient) {
        const nextImprovedResume = {
          ...improvedResume,
          improvedJson: {
            ...improvedResume.improvedJson,
            suggestedBullets: (improvedResume.improvedJson?.suggestedBullets || []).map((item) =>
              item.id === suggestionId ? { ...item, status: decision } : item
            ),
            sections: (improvedResume.improvedJson?.sections || []).map((section) => {
              if (decision !== "accepted" || section.id !== "experience" || !section.items?.length) {
                return section;
              }

              const acceptedSuggestion = (improvedResume.improvedJson?.suggestedBullets || []).find((item) => item.id === suggestionId);
              if (!acceptedSuggestion) {
                return section;
              }

              return {
                ...section,
                items: section.items.map((entry, index) =>
                  index === 0
                    ? {
                        ...entry,
                        bullets: [...(entry.bullets || []), { text: acceptedSuggestion.text, suggested: true }]
                      }
                    : entry
                )
              };
            }),
            transparencyLog: (improvedResume.improvedJson?.transparencyLog || []).map((item) =>
              item.id === suggestionId ? { ...item, status: decision } : item
            )
          }
        };

        setImprovedResume(nextImprovedResume);
        saveTransientRewrite(reviewId, mode, nextImprovedResume);
        return;
      }

      const result = await apiFetch(`/api/reviews/improved/${improvedResume.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ suggestionId, decision })
      });

      setImprovedResume(result.improvedResume);
      setReview((current) => ({
        ...current,
        improvedResumes: (current.improvedResumes || []).map((item) => (item.id === result.improvedResume.id ? result.improvedResume : item))
      }));
    } catch (requestError) {
      setError(requestError.message || "Could not save your decision.");
    }
  }

  async function handleDownload() {
    if (!previewRef.current) {
      return;
    }

    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf()
      .set({
        margin: 0.4,
        filename: `rolemate-${mode.toLowerCase()}-resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      })
      .from(previewRef.current)
      .save();

    setShowFeedback(true);
  }

  async function handleCopy() {
    const text = resumeJsonToText(improvedResume?.improvedJson);
    await navigator.clipboard.writeText(text);
    setShowFeedback(true);
  }

  async function sendFeedback(rating) {
    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          analysisId: reviewId,
          rating,
          comments: feedbackText
        })
      });
      setFeedbackText("");
    } catch (requestError) {
      setError(requestError.message || "Could not save feedback.");
    }
  }

  if (loading) {
    return <div className="px-4 py-20 text-center text-slate">Loading the preview workspace...</div>;
  }

  if (error || !review) {
    return <div className="px-4 py-20 text-center text-red-700">{error || "Preview not found."}</div>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#efcf94]">Preview Workspace</div>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-ink">Compare the original against the Rolemate draft</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {modes.map((candidateMode) => (
            <button
              key={candidateMode}
              type="button"
              onClick={() => setMode(candidateMode)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === candidateMode ? "bg-white text-black" : "bg-white/[0.05] text-white"}`}
            >
              {candidateMode}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white px-5 py-3 text-sm font-semibold text-black"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white"
        >
          <Copy className="h-4 w-4" />
          Copy to Clipboard
        </button>
        <Link href="/app" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white">
          Start a New Review
        </Link>
      </div>

      {isPending ? (
        <div className="mt-4 rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate">Generating your {mode} draft...</div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_0.72fr]">
        <div>
          <ResumeRenderer resumeData={review.resume.structuredJson} title="Original Resume" accent="coral" />
        </div>

        <div ref={previewRef}>
          {improvedResume ? (
            <ResumeRenderer resumeData={improvedResume.improvedJson} title={`Rolemate Draft - ${mode}`} accent="teal" />
          ) : (
            <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 text-sm text-slate">Generating draft...</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="liquid-panel rounded-[2rem] p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-teal">
              <Sparkles className="h-4 w-4" />
              Transparency Log
            </div>
            <div className="mt-4 space-y-3">
              {(improvedResume?.transparencyLogJson || improvedResume?.improvedJson?.transparencyLog || []).map((item) => (
                <details key={item.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-ink">{item.change}</summary>
                  <div className="mt-3 text-xs leading-6 text-slate">
                    <div>Why: {item.reason}</div>
                    <div>Mode: {item.mode}</div>
                    <div>Source: {item.sourceType} | {item.sourceLabel}</div>
                    <div>Status: {item.status}</div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {mode === "Suggestion" ? (
            <div className="liquid-panel rounded-[2rem] p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-coral">Suggested Bullets</div>
              <div className="mt-4 space-y-3">
                {pendingSuggestions.length ? (
                  pendingSuggestions.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-sm leading-7 text-ink">{item.text}</div>
                      <div className="mt-2 text-xs text-slate">{item.reason}</div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSuggestionDecision(item.id, "accepted")}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSuggestionDecision(item.id, "rejected")}
                          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-sm text-slate">No pending suggestions right now.</div>
                )}
              </div>
            </div>
          ) : null}

          {showFeedback ? (
            <div className="liquid-panel rounded-[2rem] p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-teal">Was this helpful?</div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => sendFeedback("up")}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => sendFeedback("down")}
                  className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No
                </button>
              </div>
              <textarea
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                className="field-shell mt-4 min-h-[120px] w-full px-4 py-4 text-sm leading-7 outline-none transition"
                placeholder="Optional feedback"
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
