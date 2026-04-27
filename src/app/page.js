"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    kicker: "01",
    title: "Upload Resume",
    text: "PDF first, manual text fallback when extraction is weak."
  },
  {
    kicker: "02",
    title: "Analyze Match",
    text: "Rolemate scores the fit, names the gaps, and shows the evidence."
  },
  {
    kicker: "03",
    title: "Get Honest Rewrite",
    text: "Only what is real, verified, and fair to claim gets into the draft."
  }
];

const reveal = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <main className="page-grid overflow-hidden">
      <section className="mx-auto grid min-h-[calc(100vh-120px)] max-w-7xl items-center gap-16 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <motion.div variants={reveal} initial="hidden" animate="show" className="max-w-2xl">
          <motion.div
            variants={reveal}
            className="inline-flex items-center gap-2 rounded-full border border-[#8fd6c3]/18 bg-[#8fd6c3]/8 px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-[#b7efe1]"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#b7efe1]" />
            Honest Friend Rule built in
          </motion.div>
          <motion.h1
            variants={reveal}
            className="font-display mt-6 max-w-2xl text-6xl tracking-[-0.06em] text-white sm:text-7xl"
          >
            Your career deserves the truth.
          </motion.h1>
          <motion.p variants={reveal} className="mt-6 max-w-xl text-lg leading-9 text-white/62">
            Built for students who want signal without the cortisol spike. Upload your resume, paste the role, and get the blunt version in a calmer workspace.
          </motion.p>
          <motion.div variants={reveal} className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.02]"
            >
              Check My Resume
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="text-sm text-white/48">Unlimited reviews. No account. No fluff.</div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="liquid-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(183,239,225,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(143,214,195,0.12),transparent_42%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8fd6c3]/20 bg-[#8fd6c3]/8 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-[#b7efe1]">
              <Sparkles className="h-3.5 w-3.5" />
              Live honesty layer
            </div>
            <div className="mt-6 rounded-[1.8rem] border border-[#8fd6c3]/12 bg-[#0c171b]/94 p-6 shadow-[0_0_60px_rgba(143,214,195,0.08)]">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">Harsh Truth</div>
              <p className="mt-5 text-[1.06rem] leading-9 text-white/88">
                Your customer-facing background is real value. But this data analyst role expects SQL, dashboards, and analysis work you have not shown yet. That gap is real. Let&apos;s find spreadsheet, reporting, or coursework evidence that actually belongs to you.
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="liquid-subtle rounded-[1.5rem] p-5">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#b7efe1]">Pros</div>
                <div className="mt-3 text-sm leading-7 text-white/72">
                  Customer communication, high-volume operations, reliability under pressure.
                </div>
              </div>
              <div className="liquid-subtle rounded-[1.5rem] p-5">
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#b7efe1]">Verification Prompt</div>
                <div className="mt-3 text-sm leading-7 text-white/72">
                  Did you ever use Excel or Google Sheets to track inventory, sales, scheduling, or team performance?
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {steps.map((step) => (
            <motion.div key={step.title} variants={reveal} className="liquid-panel rounded-[1.75rem] p-6">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/34">{step.kicker}</div>
              <h2 className="mt-5 text-3xl font-bold tracking-[-0.05em] text-white">{step.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-white/58">{step.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
