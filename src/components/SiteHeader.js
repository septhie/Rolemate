"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SiteHeader() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/app", label: "Tool" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/login", label: "Login" }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-black/42 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.14)]">
            RM
          </div>
          <div>
            <div className="font-semibold tracking-[-0.03em] text-ink">Rolemate</div>
            <div className="text-xs text-slate">Your honest career mate</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                pathname === link.href ? "bg-white text-black" : "text-slate hover:bg-white/[0.06] hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
