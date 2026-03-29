"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="glass-card rounded-[2rem] p-8">
        <div className="text-xs uppercase tracking-[0.18em] text-coral">{mode === "login" ? "Welcome back" : "Free account"}</div>
        <h1 className="mt-2 text-4xl text-ink">{mode === "login" ? "Continue with Google" : "Create your account with Google"}</h1>
        <p className="mt-4 text-sm leading-7 text-slate">
          One-tap access with Google. No paywall, no ads, no hidden billing.
        </p>

        <div className="mt-8 space-y-4">
          <GoogleSignInButton onSuccess={() => router.push("/dashboard")} onError={setError} />
          <p className="text-center text-sm leading-6 text-slate">
            Use the Google button above to sign in and unlock your saved reviews and dashboard.
          </p>
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}
