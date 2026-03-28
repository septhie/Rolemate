const STORAGE_PREFIX = "rolemate-transient-review";
const REWRITE_PREFIX = "rolemate-transient-rewrite";

function getReviewStorageKey(reviewId) {
  return `${STORAGE_PREFIX}:${reviewId}`;
}

function getRewriteStorageKey(reviewId, mode) {
  return `${REWRITE_PREFIX}:${reviewId}:${mode}`;
}

function saveTransientReview(review) {
  if (typeof window === "undefined" || !review?.id) {
    return;
  }

  window.sessionStorage.setItem(getReviewStorageKey(review.id), JSON.stringify(review));
}

function loadTransientReview(reviewId) {
  if (typeof window === "undefined" || !reviewId) {
    return null;
  }

  const raw = window.sessionStorage.getItem(getReviewStorageKey(reviewId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function saveTransientRewrite(reviewId, mode, improvedResume) {
  if (typeof window === "undefined" || !reviewId || !mode || !improvedResume) {
    return;
  }

  window.sessionStorage.setItem(getRewriteStorageKey(reviewId, mode), JSON.stringify(improvedResume));
}

function loadTransientRewrite(reviewId, mode) {
  if (typeof window === "undefined" || !reviewId || !mode) {
    return null;
  }

  const raw = window.sessionStorage.getItem(getRewriteStorageKey(reviewId, mode));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export {
  saveTransientReview,
  loadTransientReview,
  saveTransientRewrite,
  loadTransientRewrite
};
