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
      badge: "bg-red-100 text-red-700 border-red-200",
      ring: "from-red-400 to-red-500"
    };
  }

  if (score <= 65) {
    return {
      label: "Partial match - good foundation to build from",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      ring: "from-amber-400 to-orange-400"
    };
  }

  if (score <= 85) {
    return {
      label: "Strong match - let's sharpen it",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      ring: "from-emerald-400 to-teal-500"
    };
  }

  return {
    label: "Excellent fit - just polish it",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
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
