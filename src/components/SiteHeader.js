"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScanSearch } from "lucide-react";
import RolemateLogo from "@/components/RolemateLogo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/app", icon: ScanSearch, label: "Review" }
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center justify-between border-r border-white/10 bg-[#071117]/40 py-[3vh] backdrop-blur-3xl lg:flex">
        <div className="flex flex-col items-center gap-[3.4vh]">
          <RolemateLogo size={42} withWordmark={false} />
          <nav className="flex flex-col items-center gap-[1.6vh]">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-[1.1rem] border border-transparent transition",
                    active
                      ? "bg-[#8fd6c3]/14 text-[#b7efe1] shadow-[0_0_24px_rgba(143,214,195,0.16)]"
                      : "text-white/48 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-[1.6vh]">
          <div className="text-[0.62rem] uppercase tracking-[0.32em] text-white/28 [writing-mode:vertical-rl]">Open Studio</div>
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="block h-[4.3vh] min-h-[20px] w-[0.45rem] rounded-full bg-[#8fd6c3] shadow-[0_0_18px_rgba(143,214,195,0.22)]"
              />
            ))}
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-[42px] z-40 flex h-14 items-center justify-around border-t border-white/10 bg-[#071117]/80 px-4 backdrop-blur-md lg:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl border border-transparent transition",
                active
                  ? "bg-[#8fd6c3]/14 text-[#b7efe1]"
                  : "text-white/48 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
            </Link>
          );
        })}
      </nav>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-[42px] items-center justify-between border-t border-white/10 bg-[#071117]/68 px-4 text-[0.62rem] uppercase tracking-[0.22em] text-white/42 backdrop-blur-md lg:left-20 lg:h-[5.5vh] lg:min-h-[42px] lg:px-[3vw] lg:text-[0.68rem] lg:backdrop-blur-[20px]">
        <div className="flex items-center gap-[1.2vw]">
          <span className="h-2 w-2 rounded-full bg-[#8fd6c3] shadow-[0_0_16px_rgba(143,214,195,0.35)]" />
          <span>Calm, honest resume reviews</span>
        </div>
        <div className="flex items-center gap-[1vw]">
          <span>Unlimited scans</span>
          <span className="hidden sm:inline">No sign-in. No history. Just signal.</span>
        </div>
      </div>
    </>
  );
}
