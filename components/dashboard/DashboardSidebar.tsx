"use client";

import Link from "next/link";
import { Bot, Cog, Command, History, MessageSquareQuote, Orbit } from "lucide-react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Command, match: ["/dashboard"] },
  { href: "/agents", label: "Agents", icon: Bot, match: ["/agents"] },
  { href: "/prompts", label: "Prompts", icon: MessageSquareQuote, match: ["/prompts"] },
  { href: "/history", label: "Runs", icon: History, match: ["/history", "/swarm"] },
  { href: "/settings", label: "Settings", icon: Cog, match: ["/settings"] },
];

function isActive(pathname: string, matches: string[]) {
  return matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 flex h-screen w-72 flex-col px-5 py-6 qc-surface-strong border-r border-[rgba(148,163,184,0.10)]"
    >
      {/* Brand */}
      <div className="rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(34,211,238,0.05)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.08)] text-[var(--qc-text-gold)]"
          >
            <Orbit className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--qc-text-gold)]">QuanCore</p>
            <p className="mt-0.5 text-sm font-semibold text-white">Swarm Operations</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-7 flex-1">
        <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[var(--qc-text-soft)]">Workspace</p>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(pathname, match);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "text-white"
                    : "text-[var(--qc-text-soft)] hover:text-[var(--qc-text-muted)]",
                )}
                style={
                  active
                    ? {
                      background: "rgba(34, 211, 238, 0.08)",
                      border: "1px solid rgba(34, 211, 238, 0.20)",
                      boxShadow: "0 2px 14px rgba(34, 211, 238, 0.08)",
                    }
                    : {
                      border: "1px solid transparent",
                    }
                }
              >
                <Icon
                  className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-[var(--qc-text-gold)]" : "")}
                />
                <span className="font-medium">{label}</span>
                {active && (
                  <div
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--qc-text-gold)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-[rgba(148,163,184,0.10)] pt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}
