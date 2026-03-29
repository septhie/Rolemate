"use client";

import { useEffect, useState } from "react";
import { getRemainingFreeCredits, hasUnlockedFullAccess, subscribeToCreditChanges } from "@/lib/freeCredits";

export default function FreeCreditsBar() {
  const [remaining, setRemaining] = useState(3);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    function sync() {
      setRemaining(getRemainingFreeCredits());
      setUnlocked(hasUnlockedFullAccess());
    }

    sync();
    return subscribeToCreditChanges(sync);
  }, []);

  return (
    <div className="border-b border-white/8 bg-black/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-white/58 sm:px-6 lg:px-8">
        <span>{unlocked ? "Career Roadmap unlocked" : "Free Credits"}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`h-2.5 w-8 rounded-full transition ${
                  unlocked || index < remaining ? "bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)]" : "bg-white/12"
                }`}
              />
            ))}
          </div>
          <span className="text-white/80">{unlocked ? "Unlimited" : `${remaining}/3`}</span>
        </div>
      </div>
    </div>
  );
}
