"use client";

import { motion } from "framer-motion";

export default function HonestFriendAvatar() {
  return (
    <motion.div
      animate={{ scale: [1, 1.04, 1], opacity: [0.78, 1, 0.78] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04]"
    >
      <div className="absolute inset-1 rounded-[18px] bg-[radial-gradient(circle_at_center,rgba(212,168,92,0.22),transparent_68%)] blur-lg" />
      <div className="relative h-6 w-6 rounded-full border border-white/45">
        <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#efcf94] shadow-[0_0_18px_rgba(212,168,92,0.38)]" />
      </div>
    </motion.div>
  );
}
