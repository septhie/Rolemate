const pdfParse = require("pdf-parse");

const MAX_PDF_SIZE = 5 * 1024 * 1024;

function normalizeResumeText(text = "") {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

function validatePdf(file) {
  if (!file) {
    throw new Error("Upload a PDF resume or paste your resume as text.");
  }

  if (file.mimetype !== "application/pdf") {
    throw new Error("Resume uploads must be PDF files only.");
  }

  if (file.size > MAX_PDF_SIZE) {
    throw new Error("Your PDF is over the 5MB limit. Please upload a smaller file.");
  }
}

function createPreviewSnippet(text) {
  return text.split(/\s+/).slice(0, 45).join(" ");
}

async function extractResumeText({ file, manualText }) {
  if (manualText?.trim()) {
    const extractedText = normalizeResumeText(manualText);
    return {
      extractedText,
      previewSnippet: createPreviewSnippet(extractedText),
      warnings: extractedText.split(/\s+/).length < 100 ? ["Your resume seems short. The more detail you add, the better your results."] : [],
      usedManualInput: true,
      scannedLikely: false
    };
  }

  validatePdf(file);

  const pdfResult = await pdfParse(file.buffer);
  const extractedText = normalizeResumeText(pdfResult.text);
  const warnings = [];

  if (!extractedText) {
    const error = new Error("We couldn't read your PDF. Try pasting your resume as text instead.");
    error.code = "UNREADABLE_PDF";
    throw error;
  }

  const scannedLikely = extractedText.length < 120 && Number(pdfResult.numpages || 0) > 0;
  if (scannedLikely) {
    warnings.push("This looks like an image-based PDF, so text extraction may be limited. You can paste your resume as text if needed.");
  }

  if (extractedText.split(/\s+/).length < 100) {
    warnings.push("Your resume seems short. The more detail you add, the better your results.");
  }

  return {
    extractedText,
    previewSnippet: createPreviewSnippet(extractedText),
    warnings,
    usedManualInput: false,
    scannedLikely
  };
}

module.exports = {
  MAX_PDF_SIZE,
  normalizeResumeText,
  validatePdf,
  extractResumeText
};

