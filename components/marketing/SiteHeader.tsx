import Link from "next/link";
import { Orbit } from "lucide-react";

interface SiteHeaderProps {
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
  showDashboardLink?: boolean;
}

export function SiteHeader({
  primaryCtaHref = "/register",
  primaryCtaLabel = "Get started",
  showDashboardLink = true,
}: SiteHeaderProps) {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
      <Link href="/" className="group flex items-center gap-3">
        <div className="qc-surface flex h-9 w-9 items-center justify-center rounded-xl text-[var(--qc-text-gold)] transition-all group-hover:border-[rgba(34,211,238,0.35)]">
          <Orbit className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] font-medium uppercase tracking-[0.34em] text-[var(--qc-text-soft)]">
            QuanCore
          </div>
          <div className="text-sm font-semibold text-white">Swarm Operations</div>
        </div>
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/pricing" className="text-sm font-medium text-[var(--qc-text-muted)] transition hover:text-white">
          Pricing
        </Link>
        {showDashboardLink ? (
          <Link href="/dashboard" className="text-sm font-medium text-[var(--qc-text-muted)] transition hover:text-white">
            Dashboard
          </Link>
        ) : null}
        <Link href={primaryCtaHref}>
          <button className="btn-gold text-sm">{primaryCtaLabel}</button>
        </Link>
      </nav>
    </header>
  );
}

