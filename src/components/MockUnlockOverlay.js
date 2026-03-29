"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function MockUnlockOverlay({ open, isProcessing, isUnlocked, onContinue }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0d1117]/78 px-4 backdrop-blur-3xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="liquid-panel relative w-full max-w-2xl overflow-hidden rounded-[2rem] p-8 sm:p-10"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a85c]/45 to-transparent" />
            <div className="inline-flex rounded-full border border-[#d4a85c]/25 bg-[#d4a85c]/8 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-[#efcf94]">
              Save Your Progress
            </div>
            <h2 className="mt-6 max-w-xl text-4xl font-bold tracking-[-0.05em] text-white sm:text-5xl">
              You&apos;re on a roll.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/68">
              Sign in with Google to save your history, track your ATS score over time, and keep your Honest Friend in your corner.
            </p>

            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
              <button
                type="button"
                onClick={onContinue}
                disabled={isProcessing || isUnlocked}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border border-white/14 bg-white/[0.08] px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,168,92,0.26),transparent_62%)] opacity-80 blur-xl transition group-hover:opacity-100" />
                <span className="relative z-10">
                  {isProcessing ? "Processing..." : isUnlocked ? "Success!" : "Continue with Google"}
                </span>
              </button>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  initial={false}
                  animate={{
                    width: isUnlocked ? "100%" : isProcessing ? "72%" : "18%",
                    opacity: isProcessing || isUnlocked ? 1 : 0.5
                  }}
                  transition={{ duration: isUnlocked ? 0.35 : 1.2, ease: "easeInOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#c7902f] via-[#d4a85c] to-[#efcf94] shadow-[0_0_30px_rgba(212,168,92,0.45)]"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
