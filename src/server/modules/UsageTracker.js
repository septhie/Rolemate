const jwt = require("jsonwebtoken");
const env = require("../utils/env");
const { hashIp } = require("../utils/hash");

const COOKIE_NAME = "rolemate_guest_usage";
const FREE_REVIEW_LIMIT = 3;

function getClientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
}

function readUsageToken(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return { count: 0, reviewIds: [] };
  }

  try {
    return jwt.verify(token, env.cookieSecret);
  } catch (error) {
    return { count: 0, reviewIds: [] };
  }
}

function getUsageState(req) {
  const existing = readUsageToken(req);
  const ipHash = hashIp(getClientIp(req), env.cookieSecret);

  if (existing.ipHash && existing.ipHash !== ipHash) {
    return { count: 0, reviewIds: [], ipHash };
  }

  return {
    count: existing.count || 0,
    reviewIds: existing.reviewIds || [],
    ipHash
  };
}

function persistUsageState(res, state) {
  const token = jwt.sign(state, env.cookieSecret, { expiresIn: "90d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: 1000 * 60 * 60 * 24 * 90
  });
}

function assertUsageAllowed(req) {
  if (req.user) {
    return;
  }

  const state = getUsageState(req);
  if (state.count >= FREE_REVIEW_LIMIT) {
    const error = new Error("You've used your 3 free reviews. Create a free Rolemate account to keep going - no payment, ever.");
    error.statusCode = 403;
    error.code = "FREE_LIMIT_REACHED";
    throw error;
  }
}

function recordCompletedReview(req, res, analysisId) {
  if (req.user) {
    return { count: Infinity, remaining: Infinity, showSignupPrompt: false };
  }

  // We key anonymous usage to both a signed cookie and a hashed IP fingerprint so the
  // free-review cap is lightweight without storing personal data in the database.
  const state = getUsageState(req);
  const nextState = {
    ...state,
    count: state.reviewIds.includes(analysisId) ? state.count : state.count + 1,
    reviewIds: state.reviewIds.includes(analysisId) ? state.reviewIds : [...state.reviewIds, analysisId].slice(-10)
  };

  persistUsageState(res, nextState);

  return {
    count: nextState.count,
    remaining: Math.max(0, FREE_REVIEW_LIMIT - nextState.count),
    showSignupPrompt: nextState.count >= FREE_REVIEW_LIMIT
  };
}

module.exports = {
  assertUsageAllowed,
  getUsageState,
  recordCompletedReview,
  FREE_REVIEW_LIMIT
};
