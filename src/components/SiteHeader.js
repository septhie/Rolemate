"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import RolemateLogo from "@/components/RolemateLogo";

export default function SiteHeader() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/app", label: "Tool" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/login", label: "Login" }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0d1117]/78 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <RolemateLogo />

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                pathname === link.href ? "bg-[#d4a85c] text-black" : "text-slate hover:bg-white/[0.06] hover:text-ink"
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
