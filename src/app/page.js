import Link from "next/link";

const steps = [
  {
    title: "Upload Resume",
    text: "Send a PDF resume or paste the text if extraction struggles."
  },
  {
    title: "Analyze Match",
    text: "See direct matches, soft gaps, hard gaps, and a transparent fit score."
  },
  {
    title: "Get Honest Rewrite",
    text: "Rolemate rewrites only from what is real and verified."
  }
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="bg-hero-mesh">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-coral/20 bg-white/70 px-4 py-2 text-sm text-coral">
              Honest Friend Rule built in
            </div>
            <h1 className="mt-6 text-5xl leading-tight text-ink sm:text-6xl">
              Your honest career mate
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate">
              Upload your resume. Paste the job description. Get real feedback - no fluff, no made-up
              skills.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/app"
                className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal"
              >
                Check My Resume - It&apos;s Free
              </Link>
              <div className="text-sm text-slate">3 free reviews - No credit card - No BS</div>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <div className="rounded-[1.5rem] bg-ink p-6 text-white">
              <div className="text-sm uppercase tracking-[0.2em] text-sand">Honest Assessment</div>
              <p className="mt-4 text-lg leading-8 text-white/90">
                Your background shows strong customer-facing experience, but this data analyst role asks
                for SQL and dashboard work you have not shown yet. That&apos;s a real gap. Let&apos;s pull out any
                spreadsheet, reporting, or class project work that is actually yours.
              </p>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl border border-black/5 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-teal">What&apos;s Working</div>
                <div className="mt-3 text-sm text-slate">Customer communication, fast-paced operations, cash handling</div>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-coral">Verification Agent</div>
                <div className="mt-3 text-sm text-slate">
                  "Did you ever use Excel or Google Sheets to track inventory, sales, or team performance?"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid-stagger grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="glass-card rounded-[2rem] p-6">
              <div className="text-sm uppercase tracking-[0.2em] text-coral">Step {index + 1}</div>
              <h2 className="mt-3 text-3xl text-ink">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
