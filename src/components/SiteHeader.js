"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, LogIn, ScanSearch } from "lucide-react";
import RolemateLogo from "@/components/RolemateLogo";
import { getRemainingFreeCredits, hasUnlockedFullAccess, subscribeToCreditChanges } from "@/lib/freeCredits";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/app", icon: ScanSearch, label: "Studio" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/login", icon: LogIn, label: "Login" }
];

export default function SiteHeader() {
  const pathname = usePathname();
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
    <aside className="fixed left-5 top-5 z-30 flex h-[calc(100vh-40px)] w-[60px] flex-col items-center justify-between rounded-[30px] border border-white/8 bg-[#0d1117]/76 py-5 backdrop-blur-2xl">
      <div className="flex flex-col items-center gap-6">
        <RolemateLogo size={38} withWordmark={false} />
        <nav className="flex flex-col items-center gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.label}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
                  active
                    ? "border-[#d4a85c]/30 bg-[#d4a85c]/16 text-[#efcf94]"
                    : "border-transparent bg-transparent text-white/48 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="text-[9px] uppercase tracking-[0.3em] text-white/30 [writing-mode:vertical-rl]">
          {unlocked ? "Guest unlocked" : "3 free"}
        </div>
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={`block h-6 w-2 rounded-full ${
                unlocked || index < remaining ? "bg-[#d4a85c] shadow-[0_0_18px_rgba(212,168,92,0.45)]" : "bg-white/12"
              }`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
