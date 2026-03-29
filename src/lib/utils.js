import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function getScoreTheme(score) {
  if (score <= 40) {
    return {
      label: "Significant gaps, but let's work with what you have",
      badge: "bg-red-400/10 text-red-200 border-red-400/20",
      ring: "from-red-400 to-red-500"
    };
  }

  if (score <= 65) {
    return {
      label: "Partial match - good foundation to build from",
      badge: "bg-amber-400/10 text-amber-200 border-amber-400/20",
      ring: "from-amber-400 to-orange-400"
    };
  }

  if (score <= 85) {
    return {
      label: "Strong match - let's sharpen it",
      badge: "bg-emerald-400/10 text-emerald-200 border-emerald-400/20",
      ring: "from-emerald-400 to-teal-500"
    };
  }

  return {
    label: "Excellent fit - just polish it",
    badge: "bg-sky-400/10 text-sky-200 border-sky-400/20",
    ring: "from-sky-400 to-blue-500"
  };
}

function truncate(text, length = 240) {
  if (!text) {
    return "";
  }

  return text.length <= length ? text : `${text.slice(0, length).trim()}...`;
}

export { cn, formatDate, getScoreTheme, truncate };
