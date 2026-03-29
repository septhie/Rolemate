"use client";

export default function JobDescriptionInput({
  jobDescription,
  setJobDescription,
  jobTitle,
  setJobTitle,
  companyName,
  setCompanyName
}) {
  return (
    <div className="liquid-panel rounded-[2rem] p-6">
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Role Context</div>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-ink">Paste the job description</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate">
          Job Title
          <input
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            className="field-shell mt-2 w-full px-4 py-3 outline-none ring-0 transition"
            placeholder="Data Analyst Intern"
          />
        </label>

        <label className="text-sm text-slate">
          Company Name
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="field-shell mt-2 w-full px-4 py-3 outline-none ring-0 transition"
            placeholder="Handshake"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm text-slate">
        Full Job Description
        <textarea
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          className="field-shell mt-2 min-h-[320px] w-full px-4 py-4 text-sm leading-7 outline-none transition"
          placeholder="Paste the full job description here."
        />
      </label>

      <div className="mt-3 flex items-center justify-between text-xs text-slate">
        <span>{jobDescription.length} characters</span>
        {jobDescription.length < 100 ? <span>Add more of the job description for better results</span> : <span>Ready for analysis</span>}
      </div>
    </div>
  );
}
