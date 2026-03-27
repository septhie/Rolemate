"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import JobDescriptionInput from "@/components/JobDescriptionInput";

const progressSteps = [
  "Reading your resume...",
  "Analyzing the role...",
  "Building your Mismatch Matrix...",
  "Writing your report..."
];

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

  const canSubmit = useMemo(() => {
    const hasResume = Boolean(resumeFile) || manualResumeText.trim().length > 0;
    return hasResume && jobDescription.trim().length >= 100;
  }, [resumeFile, manualResumeText, jobDescription]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setError("");
    const formData = new FormData();
    if (resumeFile) {
      formData.append("resumePdf", resumeFile);
    }
    formData.append("manualResumeText", manualResumeText);
    formData.append("jobDescription", jobDescription);
    formData.append("jobTitle", jobTitle);
    formData.append("companyName", companyName);

    let step = 0;
    const timer = setInterval(() => {
      step = Math.min(progressSteps.length - 1, step + 1);
      setProgressIndex(step);
    }, 1000);

    setIsSubmitting(true);

    try {
      const result = await apiFetch("/api/reviews", {
        method: "POST",
        body: formData,
        timeoutMs: 60000
      });

      const nextUrl = result.usage?.showSignupPrompt
        ? `/app/results/${result.review.id}?signupPrompt=1`
        : `/app/results/${result.review.id}`;
      router.push(nextUrl);
    } catch (requestError) {
      setError(requestError.message || "Something went wrong while analyzing your resume.");
    } finally {
      clearInterval(timer);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <div className="text-xs uppercase tracking-[0.18em] text-coral">Free honest review</div>
        <h1 className="mt-2 text-5xl text-ink">Tailor your resume without making anything up</h1>
        <p className="mt-4 text-base leading-8 text-slate">
          Rolemate reads the job description, finds the real gaps, and interviews you for missing evidence
          instead of fabricating it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="glass-card rounded-[2rem] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-coral">Resume Intake</div>
          <h2 className="mt-2 text-3xl text-ink">Upload a PDF resume</h2>

          <label className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-navy/20 bg-white p-8 text-center transition hover:border-teal">
            <Upload className="h-10 w-10 text-teal" />
            <div className="mt-4 text-lg text-ink">{resumeFile ? resumeFile.name : "Drag in a PDF or click to browse"}</div>
            <div className="mt-2 text-sm text-slate">PDF only - max 5MB</div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
            />
          </label>

          <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <FileText className="h-4 w-4 text-coral" />
              Manual text fallback
            </div>
            <textarea
              value={manualResumeText}
              onChange={(event) => setManualResumeText(event.target.value)}
              className="mt-3 min-h-[180px] w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-4 text-sm leading-7 text-ink outline-none transition focus:border-teal"
              placeholder="If your PDF is image-based or unreadable, paste your resume here."
            />
          </div>

          {resumeFile?.size > 5 * 1024 * 1024 ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

        <div className="glass-card rounded-[2rem] p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-slate">Honest-first analysis only</div>
              <div className="mt-1 text-lg text-ink">Rolemate will never invent skills, jobs, degrees, or certifications.</div>
              {isSubmitting ? (
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <Link href="/" className="text-teal underline-offset-4 hover:underline">
                    Home
                  </Link>
                  <Link href="/dashboard" className="text-teal underline-offset-4 hover:underline">
                    Dashboard
                  </Link>
                  <Link href="/login" className="text-teal underline-offset-4 hover:underline">
                    Login
                  </Link>
                </div>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting || resumeFile?.size > 5 * 1024 * 1024}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal disabled:cursor-not-allowed disabled:bg-slate"
            >
              {isSubmitting ? progressSteps[progressIndex] : "Analyze"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
        </div>
      </form>
    </main>
  );
}
