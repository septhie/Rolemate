function createTransparencyEntry({
  id,
  change,
  reason,
  mode,
  sourceType,
  sourceLabel,
  status = "applied"
}) {
  return {
    id,
    change,
    reason,
    mode,
    sourceType,
    sourceLabel,
    status
  };
}

module.exports = {
  createTransparencyEntry
};
