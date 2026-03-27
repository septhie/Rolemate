"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiFetch(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="glass-card rounded-[2rem] p-8">
        <div className="text-xs uppercase tracking-[0.18em] text-coral">{mode === "login" ? "Welcome back" : "Free account"}</div>
        <h1 className="mt-2 text-4xl text-ink">{mode === "login" ? "Log in" : "Create your account"}</h1>
        <p className="mt-4 text-sm leading-7 text-slate">
          Email/password plus Google sign-in. No paywall, no ads, no hidden billing.
        </p>

        <div className="mt-8 space-y-4">
          <GoogleSignInButton onSuccess={() => router.push("/dashboard")} onError={setError} />
          <div className="text-center text-xs uppercase tracking-[0.18em] text-slate">or use email</div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-slate">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-teal"
              required
            />
          </label>

          <label className="block text-sm text-slate">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink outline-none transition focus:border-teal"
              minLength={8}
              required
            />
          </label>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal disabled:bg-slate"
          >
            {isSubmitting ? "Working..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
