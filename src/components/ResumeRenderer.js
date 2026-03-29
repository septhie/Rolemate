"use client";

function normalizeResume(resumeData) {
  if (!resumeData) {
    return {
      contactName: "Resume",
      contactLine: "",
      summary: "",
      sections: []
    };
  }

  if (resumeData.sections) {
    return resumeData;
  }

  return {
    contactName: resumeData.contactInfo?.name || "Original Resume",
    contactLine: [resumeData.contactInfo?.email, resumeData.contactInfo?.phone, resumeData.contactInfo?.location]
      .filter(Boolean)
      .join(" | "),
    summary: resumeData.summary || "",
    sections: [
      {
        id: "skills",
        title: "Skills",
        type: "skill-list",
        items: resumeData.skills || []
      },
      {
        id: "experience",
        title: "Experience",
        type: "entries",
        items: (resumeData.workExperience || []).map((entry) => ({
          title: entry.role,
          subtitle: [entry.company, entry.location].filter(Boolean).join(" | "),
          dates: entry.dates,
          bullets: (entry.bullets || []).map((bullet) => ({ text: bullet }))
        }))
      },
      {
        id: "projects",
        title: "Projects",
        type: "entries",
        items: (resumeData.projects || []).map((entry) => ({
          title: entry.name,
          subtitle: entry.context,
          dates: "",
          bullets: (entry.bullets || []).map((bullet) => ({ text: bullet }))
        }))
      },
      {
        id: "education",
        title: "Education",
        type: "entries",
        items: (resumeData.education || []).map((entry) => ({
          title: entry.school,
          subtitle: entry.degree,
          dates: entry.dates,
          bullets: (entry.bullets || []).map((bullet) => ({ text: bullet }))
        }))
      }
    ].filter((section) => section.items?.length)
  };
}

export default function ResumeRenderer({ resumeData, accent = "teal", title = "Resume" }) {
  const normalized = normalizeResume(resumeData);

  return (
    <div className="liquid-panel rounded-[2rem] p-6">
      <div className="border-b border-white/8 pb-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate">{title}</div>
        <h3 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-ink">{normalized.contactName}</h3>
        {normalized.contactLine ? <p className="mt-2 text-sm text-slate">{normalized.contactLine}</p> : null}
        {normalized.summary ? <p className="mt-4 text-sm leading-7 text-slate">{normalized.summary}</p> : null}
      </div>

      <div className="mt-6 space-y-6">
        {normalized.sections.map((section) => (
          <section key={section.id}>
            <div className={`text-xs uppercase tracking-[0.18em] ${accent === "coral" ? "text-coral" : "text-teal"}`}>
              {section.title}
            </div>

            {section.type === "skill-list" ? (
              <p className="mt-3 text-sm leading-7 text-ink">{section.items.join(" | ")}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {section.items.map((item, index) => (
                  <div key={`${section.id}-${index}`} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-medium text-ink">{item.title}</div>
                        {item.subtitle ? <div className="text-sm text-slate">{item.subtitle}</div> : null}
                      </div>
                      {item.dates ? <div className="text-xs uppercase tracking-[0.14em] text-slate">{item.dates}</div> : null}
                    </div>
                    {item.bullets?.length ? (
                      <ul className="mt-3 space-y-2 pl-5 text-sm leading-7 text-ink">
                        {item.bullets.map((bullet, bulletIndex) => (
                          <li
                            key={`${section.id}-${index}-${bulletIndex}`}
                            className={bullet.suggested ? "rounded-2xl bg-amber-400/12 px-3 py-2 text-amber-100" : ""}
                          >
                            {bullet.text || bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
