function renderEntry(entry) {
  const bullets = (entry.bullets || [])
    .map((bullet) => `<li>${bullet.text || bullet}</li>`)
    .join("");

  return `
    <section class="resume-entry">
      <div class="resume-entry-head">
        <div>
          <h3>${entry.title || entry.role || entry.name || ""}</h3>
          <p>${entry.subtitle || entry.company || entry.context || ""}</p>
        </div>
        <span>${entry.dates || ""}</span>
      </div>
      ${bullets ? `<ul>${bullets}</ul>` : ""}
    </section>
  `;
}

function renderSection(section) {
  if (section.type === "skill-list") {
    return `
      <section class="resume-section">
        <h2>${section.title}</h2>
        <p>${(section.items || []).join(" | ")}</p>
      </section>
    `;
  }

  if (section.type === "text") {
    return `
      <section class="resume-section">
        <h2>${section.title}</h2>
        <p>${section.items?.[0] || ""}</p>
      </section>
    `;
  }

  return `
    <section class="resume-section">
      <h2>${section.title}</h2>
      ${(section.items || []).map(renderEntry).join("")}
    </section>
  `;
}

function renderResumeHtml(improvedJson) {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Rolemate Resume Preview</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #10212A;
          background: #ffffff;
          margin: 0;
          padding: 32px;
        }
        .resume-shell {
          max-width: 850px;
          margin: 0 auto;
        }
        .resume-header {
          border-bottom: 2px solid #17324A;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .resume-header h1 {
          margin: 0 0 8px;
          font-size: 30px;
        }
        .resume-header p {
          margin: 6px 0;
          line-height: 1.5;
        }
        .resume-section {
          margin-bottom: 22px;
        }
        .resume-section h2 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin: 0 0 10px;
          color: #1B7F8B;
        }
        .resume-entry {
          margin-bottom: 16px;
        }
        .resume-entry-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: baseline;
        }
        .resume-entry-head h3 {
          margin: 0;
          font-size: 16px;
        }
        .resume-entry-head p {
          margin: 4px 0 0;
          color: #5A6473;
        }
        ul {
          margin: 8px 0 0 18px;
          padding: 0;
        }
        li {
          margin-bottom: 6px;
          line-height: 1.55;
        }
      </style>
    </head>
    <body>
      <main class="resume-shell">
        <header class="resume-header">
          <h1>${improvedJson.contactName || "Tailored Resume"}</h1>
          <p>${improvedJson.contactLine || ""}</p>
          <p>${improvedJson.summary || ""}</p>
        </header>
        ${(improvedJson.sections || []).map(renderSection).join("")}
      </main>
    </body>
  </html>
  `;
}

module.exports = {
  renderResumeHtml
};
