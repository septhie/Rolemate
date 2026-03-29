const USED_KEY = "rolemate-free-credits-used";
const UNLOCKED_KEY = "rolemate-mock-auth-unlocked";

function isBrowser() {
  return typeof window !== "undefined";
}

function emitChange() {
  if (isBrowser()) {
    window.dispatchEvent(new Event("rolemate-credits-change"));
  }
}

export function getUsedFreeCredits() {
  if (!isBrowser()) {
    return 0;
  }

  const value = Number.parseInt(window.localStorage.getItem(USED_KEY) || "0", 10);
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 3) : 0;
}

export function getRemainingFreeCredits() {
  return Math.max(0, 3 - getUsedFreeCredits());
}

export function hasUnlockedFullAccess() {
  if (!isBrowser()) {
    return false;
  }

  return window.localStorage.getItem(UNLOCKED_KEY) === "true";
}

export function shouldGateNextReview() {
  return getUsedFreeCredits() >= 3 && !hasUnlockedFullAccess();
}

export function registerCompletedFreeReview() {
  if (!isBrowser()) {
    return;
  }

  const nextValue = Math.min(getUsedFreeCredits() + 1, 3);
  window.localStorage.setItem(USED_KEY, String(nextValue));
  emitChange();
}

export function unlockFullAccess() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(UNLOCKED_KEY, "true");
  emitChange();
}

export function subscribeToCreditChanges(callback) {
  if (!isBrowser()) {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("rolemate-credits-change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("rolemate-credits-change", handler);
  };
}
