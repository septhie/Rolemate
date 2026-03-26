function normalizeJobDescription(text = "") {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

function validateJobDescription(jobDescription) {
  const normalized = normalizeJobDescription(jobDescription);

  if (normalized.length < 100) {
    throw new Error("Add more of the job description for better results.");
  }

  return normalized;
}

module.exports = {
  normalizeJobDescription,
  validateJobDescription
};

