function condenseText(text = "", maxChars = 5000) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const kept = [];
  let total = 0;

  for (const line of lines) {
    const isHighSignal =
      line.length < 90 ||
      /^[•*-]/.test(line) ||
      /require|must|preferred|responsib|experience|skill|project|education|summary|objective/i.test(line);

    if (!isHighSignal) {
      continue;
    }

    kept.push(line);
    total += line.length + 1;
    if (total >= maxChars) {
      break;
    }
  }

  const condensed = kept.join("\n");
  return condensed.slice(0, maxChars);
}

module.exports = {
  condenseText
};
