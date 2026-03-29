"use client";

import Link from "next/link";

export default function RolemateLogo({ size = 44, withWordmark = true, className = "", watermark = false }) {
  const logo = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-[18px] border border-white/10 ${
          watermark ? "bg-white/[0.02]" : "bg-white/[0.04]"
        }`}
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle,rgba(212,168,92,0.34),transparent_70%)] blur-md" />
        <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M14 54V10h18.5c10.4 0 17.5 6.7 17.5 16.3 0 7.1-3.6 11.9-9.9 14.2L52 54H36.6L27.4 42.2H26V54H14Z"
            fill="rgba(255,255,255,0.06)"
          />
          <path
            d="M20 50V14h13.8c8.1 0 12.8 4.4 12.8 11.1 0 5.1-2.8 8.7-7.6 10.5L48.5 50H38.8l-8-12.5H28V50H20Z"
            fill="url(#glassA)"
          />
          <path
            d="M28 30.4h4.9c4.2 0 6.5-1.8 6.5-4.9S37.1 20.7 33 20.7H28v9.7Z"
            fill="url(#glassB)"
          />
          <defs>
            <linearGradient id="glassA" x1="16" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#d4a85c" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="glassB" x1="28" y1="19" x2="42" y2="35" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#c7902f" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {withWordmark ? (
        <div>
          <div className="font-semibold tracking-[-0.03em] text-ink">Rolemate</div>
          <div className="text-xs text-slate">Your honest career mate</div>
        </div>
      ) : null}
    </div>
  );

  return (
    <Link href="/" aria-label="Rolemate home">
      {logo}
    </Link>
  );
}
