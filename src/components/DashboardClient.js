"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatDate, getScoreTheme } from "@/lib/utils";

export default function DashboardClient() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const result = await apiFetch("/api/dashboard/history");
        if (active) {
          setHistory(result.analyses || []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Please sign in to view your dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="px-4 py-20 text-center text-slate">Loading your review history...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="glass-card rounded-[2rem] p-8 text-center">
          <h1 className="text-4xl text-ink">Dashboard</h1>
          <p className="mt-4 text-sm leading-7 text-slate">{error}</p>
          <div className="mt-6">
            <Link href="/login" className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white">
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.18em] text-coral">Saved Reviews</div>
        <h1 className="mt-2 text-4xl text-ink">Your Rolemate dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {history.map((analysis) => {
          const theme = getScoreTheme(analysis.fitScore);
          return (
            <div key={analysis.id} className="glass-card rounded-[2rem] p-6">
              <div className={`inline-flex rounded-full border px-3 py-2 text-xs ${theme.badge}`}>
                Score {analysis.fitScore}
              </div>
              <h2 className="mt-4 text-3xl text-ink">{analysis.jobProfile.jobTitle || "Untitled role"}</h2>
              <p className="mt-2 text-sm text-slate">{analysis.jobProfile.companyName || "Company not provided"}</p>
              <p className="mt-4 text-sm leading-7 text-slate">{theme.label}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate">{formatDate(analysis.createdAt)}</p>
              <div className="mt-6 flex gap-3">
                <Link href={`/app/results/${analysis.id}`} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
                  View Results
                </Link>
                <Link href={`/app/preview/${analysis.id}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">
                  Open Preview
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

