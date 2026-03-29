"use client";

import { motion } from "framer-motion";

export default function ScoreGauge({ score }) {
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (Math.max(0, Math.min(score, 100)) / 100) * circumference;

  return (
    <div className="relative flex h-[220px] w-[220px] items-center justify-center">
      <div className="absolute inset-4 rounded-full bg-[#d4a85c]/12 blur-3xl" />
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 18px rgba(212, 168, 92, 0.72))" }}
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#efcf94" />
            <stop offset="50%" stopColor="#d4a85c" />
            <stop offset="100%" stopColor="#c7902f" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[11px] uppercase tracking-[0.28em] text-white/48">ATS Fit</div>
        <div className="mt-2 text-6xl font-bold tracking-[-0.06em] text-white">{score}</div>
        <div className="mt-1 text-sm text-[#efcf94]">out of 100</div>
      </div>
    </div>
  );
}
